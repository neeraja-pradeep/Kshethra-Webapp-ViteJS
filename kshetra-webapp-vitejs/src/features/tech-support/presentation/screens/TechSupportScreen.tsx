import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { Alert, Button, Icon, Input, Select, Textarea } from '@/shared/ui'

import { useMyPermissionsQuery } from '@/features/auth/application/queries/useMyPermissionsQuery'
import { sessionDisplayName } from '@/features/auth/domain/entities/session-user'
import {
  useSubmitTicketMutation,
  toWebhookFailure,
  WebhookFailureError,
} from '@/features/tech-support/application/queries/useSubmitTicketMutation'
import { useUploadAttachmentMutation } from '@/features/tech-support/application/queries/useUploadAttachmentMutation'
import { isPlausiblyAccepted } from '@/features/tech-support/domain/entities/attachment-upload'
import type {
  TicketAttachment,
  TicketDraft,
  TicketPriority,
} from '@/features/tech-support/domain/entities/support-ticket'
import { AttachmentField } from '@/features/tech-support/presentation/components/AttachmentField'
import {
  blankTicketDraft,
  formatBytes,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  PRIORITY_OPTIONS,
  validateTicketDraft,
  type TicketFormErrors,
} from '@/features/tech-support/presentation/lib/supportDisplay'

const TOAST_MS = 3200

/**
 * Tech support — where a console user reports something broken. Route: `/tech-support`.
 *
 * Open to every signed-in console user by design: the people most likely to hit
 * a bug are the ones with the fewest permissions, and gating the complaint box
 * behind a permission would silence exactly them.
 *
 * The report goes to our own backend's tech-support relay
 * (`/api/tech-support/*`, see `infrastructure/data-sources/remote/techSupport.api.ts`),
 * which files it as a Clozr ticket. Staged files are uploaded through the
 * relay first, one at a time, and the ticket redeems their tokens. Who is
 * reporting is added by the server from the session; this screen sends only
 * what the reporter chose, plus the page they were on.
 */
export function TechSupportScreen() {
  const { data: me } = useMyPermissionsQuery()
  const location = useLocation()
  const submitMutation = useSubmitTicketMutation()
  const uploadAttachment = useUploadAttachmentMutation()

  const [draft, setDraft] = useState<TicketDraft>(blankTicketDraft)
  const [errors, setErrors] = useState<TicketFormErrors>({})
  const [sent, setSent] = useState(false)
  /** What the confirmation says — "Report sent", or a partial-attachment note. */
  const [sentNote, setSentNote] = useState('Report sent')
  /** True while the click's own uploads are running, before the ticket POST. */
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /**
   * Every object URL this screen minted, so unmount can revoke them.
   *
   * A preview is a live handle on the picked File; dropping the reference
   * without revoking keeps the whole image alive for the life of the tab.
   */
  const objectUrls = useRef<string[]>([])

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      for (const url of objectUrls.current) URL.revokeObjectURL(url)
    },
    [],
  )

  /** Revoke previews we are dropping, and stop tracking them. */
  function discardAttachments(attachments: readonly TicketAttachment[]) {
    const dropped = new Set(attachments.map((a) => a.url))
    for (const url of dropped) URL.revokeObjectURL(url)
    objectUrls.current = objectUrls.current.filter((url) => !dropped.has(url))
  }

  /** Patch one attachment in place, leaving the rest of the draft alone. */
  function patchAttachment(id: string, patch: Partial<TicketAttachment>) {
    setDraft((prev) => ({
      ...prev,
      attachments: prev.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }))
  }

  function handleAddFiles(files: File[]) {
    const room = MAX_ATTACHMENTS - draft.attachments.length
    const rejected: string[] = []
    const accepted: TicketAttachment[] = []

    for (const file of files) {
      if (accepted.length >= room) {
        rejected.push(`Only ${MAX_ATTACHMENTS} files can be attached.`)
        break
      }
      // The relay's list, not `image/*`: the server sniffs content and rejects
      // anything outside it — SVG always — so offering a wider set here would
      // only spend an upload to be told no.
      if (!isPlausiblyAccepted(file)) {
        rejected.push(`${file.name} is not an accepted file type.`)
        continue
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        rejected.push(`${file.name} is over ${formatBytes(MAX_ATTACHMENT_BYTES)}.`)
        continue
      }
      const url = URL.createObjectURL(file)
      objectUrls.current.push(url)
      accepted.push({
        id: `${Date.now()}-${file.name}-${accepted.length}`,
        name: file.name,
        size: file.size,
        url,
        file,
        status: 'staged',
      })
    }

    if (accepted.length > 0) {
      setDraft((prev) => ({ ...prev, attachments: [...prev.attachments, ...accepted] }))
    }
    // An all-clean batch clears the notice; `rejected[0]` is undefined then.
    setErrors((prev) => ({ ...prev, attachments: rejected[0] }))
  }

  function handleRemoveFile(id: string) {
    const file = draft.attachments.find((a) => a.id === id)
    if (file) discardAttachments([file])
    setDraft((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.id !== id) }))
    setErrors((prev) => ({ ...prev, attachments: undefined }))
  }

  // The session carries no email — `username` is what the account menu shows.
  const account = me ? sessionDisplayName(me) : 'your account'

  /**
   * Upload every staged file, then file the ticket with whatever tokens came
   * back. Runs only on "Send report" — nothing leaves the browser before the
   * reporter asks for it.
   *
   * A file that fails to upload never blocks the report: the ticket is the
   * point, the screenshot is supporting evidence, and losing the whole report
   * because an image was rejected would be the worse outcome. Failures are
   * named in `description` (the relay has no field for them) so support knows
   * what was meant to be there.
   */
  async function handleSubmit() {
    const found = validateTicketDraft(draft)
    if (Object.keys(found).length > 0) {
      setErrors((prev) => ({ ...prev, ...found }))
      return
    }
    setErrors({})

    const staged = draft.attachments
    const tokens: string[] = []
    const failed: TicketAttachment[] = []

    if (staged.length > 0) {
      setUploadingFiles(true)
      for (const attachment of staged) patchAttachment(attachment.id, { status: 'uploading' })

      // Sequential, not parallel: the relay throttles uploads per user
      // (20/min) and Clozr limits them per source IP — now the server's, so
      // shared by the whole deployment. Firing five at once is the quickest
      // way to draw a 429 on a report that would otherwise have gone through.
      let attachmentsOff: string | null = null
      for (const attachment of staged) {
        // `409 attachments_unavailable` is a property of the deployment, not
        // of the file: once seen, the rest would fail the same way, so they
        // are not tried and the ticket goes without them.
        if (attachmentsOff) {
          failed.push(attachment)
          patchAttachment(attachment.id, { status: 'failed', error: attachmentsOff })
          continue
        }
        try {
          const uploaded = await uploadAttachment.mutateAsync(attachment.file)
          tokens.push(uploaded.token)
          patchAttachment(attachment.id, { status: 'uploaded', token: uploaded.token, expiresAt: uploaded.expiresAt })
        } catch (error) {
          const failure = error instanceof WebhookFailureError ? error.failure : null
          const message = failure?.message ?? 'Upload failed.'
          if (failure?.kind === 'attachments_unavailable') attachmentsOff = message
          failed.push(attachment)
          patchAttachment(attachment.id, { status: 'failed', error: message })
        }
      }
      setUploadingFiles(false)
    }

    // A file that failed to upload is named in the description, since the
    // relay has no field for it — support then knows it was meant to be there.
    const description = [
      draft.description.trim(),
      failed.length > 0 ? `Could not upload: ${failed.map((a) => a.name).join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    submitMutation.mutate(
      {
        subject: draft.subject.trim(),
        description: description || undefined,
        priority: draft.priority,
        // The one piece of context the server cannot know. The reporter's
        // identity ("Reported by …") is added server-side from the session.
        page: location.pathname,
        attachmentTokens: tokens.length > 0 ? tokens : undefined,
      },
      {
        onSuccess: (result) => {
          // The relay returns a count, never which tokens landed. Measured
          // against every staged file, so one that failed to upload or whose
          // token expired shows as "N of M" rather than "Report sent".
          const expected = staged.length
          const attached = result.attachmentsAttached
          setSentNote(
            expected > 0 && attached < expected
              ? `Report filed — ${attached} of ${expected} files attached.`
              : 'Report sent',
          )
          discardAttachments(draft.attachments)
          setDraft(blankTicketDraft())
          setSent(true)
          if (toastTimer.current) clearTimeout(toastTimer.current)
          toastTimer.current = setTimeout(() => setSent(false), TOAST_MS)
        },
      },
    )
  }

  const submitting = submitMutation.isPending || uploadingFiles
  const submitFailure = toWebhookFailure(submitMutation.error)

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-sunken">
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-xl font-semibold text-ink-strong">Contact support</h1>
            <p className="m-0 text-sm leading-snug text-ink-subtle">
              Tell us what went wrong and we&rsquo;ll take a look. For a screen that failed to load,
              reporting it from that screen gives us more to work with.
            </p>
          </div>

          {submitFailure && (
            <Alert type="danger" icon={<Icon name="warning" size={16} />}>
              {submitFailure.message}
            </Alert>
          )}

          <Input
            label="Subject"
            required
            placeholder="e.g. Counter receipt won't print"
            value={draft.subject}
            error={errors.subject}
            maxLength={120}
            disabled={submitting}
            onChange={(e) => {
              setDraft((prev) => ({ ...prev, subject: e.target.value }))
              setErrors((prev) => ({ ...prev, subject: undefined }))
              // A stale server failure banner from a previous attempt should
              // not survive the reporter changing anything about the report.
              if (submitMutation.isError) submitMutation.reset()
            }}
          />

          <Textarea
            label="What happened"
            rows={6}
            placeholder="What were you doing, and what did you expect to happen instead?"
            value={draft.description}
            error={errors.description}
            disabled={submitting}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
          />

          <Select
            label="Priority"
            options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={draft.priority}
            disabled={submitting}
            containerStyle={{ maxWidth: 220 }}
            onChange={(e) => setDraft((prev) => ({ ...prev, priority: e.target.value as TicketPriority }))}
          />

          <AttachmentField
            attachments={draft.attachments}
            onAdd={handleAddFiles}
            onRemove={handleRemoveFile}
            error={errors.attachments}
            disabled={submitting}
          />

          <div className="rounded-xl bg-sunken px-3.5 py-3 text-xs leading-snug text-ink-muted">
            We&rsquo;ll include your account ({account}), the page you were on ({location.pathname}), and
            technical details so support can look it up.
          </div>

          <div className="flex items-center justify-end gap-3">
            {sent && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-success-strong">
                <Icon name="check-circle" size={16} weight="fill" />
                {sentNote}
              </span>
            )}
            <Button
              theme="default"
              size="lg"
              onClick={handleSubmit}
              loading={submitting}
              iconLeft={<Icon name="paper-plane-tilt" size={16} />}
            >
              {uploadingFiles ? 'Uploading files…' : 'Send report'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
