import { useEffect, useState } from 'react'

import { toFieldErrors, toFailure } from '@/core/error/result'
import { useObjectUrl } from '@/shared/hooks/useObjectUrl'
import { cn } from '@/shared/lib/cn'
import { Alert, Input, Spinner, Switch } from '@/shared/ui'

import type { God, GodStatus } from '@/features/poojas/domain/entities/god'
import type { GodWrite } from '@/features/poojas/domain/repositories/god.repository'
import {
  blankGodForm,
  godFormSignature,
  godSaveGuardMessage,
  godToForm,
  shownImage,
  toGodWrite,
  validateGodForm,
  type GodFormState,
} from '@/features/poojas/presentation/lib/godForm'

import { ConfirmModal } from './ConfirmModal'
import { DrawerHeader } from './DrawerHeader'
import { ImageUploadTile } from './ImageUploadTile'

export interface GodDetailDrawerProps {
  open: boolean
  god: God | null
  /** Display order pre-filled when adding, taken from the list summary. */
  nextSortOrder: number
  /** In flight — the header's Save is disabled and the form is locked. */
  saving: boolean
  /**
   * Bumped by the screen on every successful edit. Editing returns to the view
   * pane rather than closing, so the operator can see what they just saved.
   */
  savedNonce: number
  deleting: boolean
  /** Whatever the last save or delete failed with, already user-safe. */
  saveError: unknown
  deleteError: unknown
  onClose: () => void
  onSave: (input: GodWrite) => void
  onDelete?: (id: number) => void
}

type ConfirmKind = 'discard' | 'delete' | 'save-guard'

/** View-first god detail drawer; Edit flips to the full boxed form. */
export function GodDetailDrawer({
  open,
  god,
  nextSortOrder,
  saving,
  savedNonce,
  deleting,
  saveError,
  deleteError,
  onClose,
  onSave,
  onDelete,
}: GodDetailDrawerProps) {
  const [mode, setMode] = useState<'view' | 'edit'>(god ? 'view' : 'edit')
  const [form, setForm] = useState<GodFormState>(() =>
    god ? godToForm(god) : blankGodForm(nextSortOrder),
  )
  const [errors, setErrors] = useState<{ name?: string }>({})
  const [initialSig, setInitialSig] = useState('')
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null)
  const [saveGuardMsg, setSaveGuardMsg] = useState('')

  const homePreview = useObjectUrl(form.homeMedia)
  const poojaPreview = useObjectUrl(form.media)

  // Field errors come back keyed by the API's own names, so `media` and
  // `home_media` surface under the tile that produced them.
  const fieldErrors = toFieldErrors(saveError)
  const failure = toFailure(saveError) ?? toFailure(deleteError)

  useEffect(() => {
    if (!open) return
    const initial = god ? godToForm(god) : blankGodForm(nextSortOrder)
    setForm(initial)
    setMode(god ? 'view' : 'edit')
    setErrors({})
    setConfirmKind(null)
    setInitialSig(godFormSignature(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, god?.id])

  // A saved edit drops back to the view pane; a saved *new* god closes the
  // drawer, which the screen does instead.
  useEffect(() => {
    if (savedNonce > 0) setMode('view')
  }, [savedNonce])

  // Re-seed from the server's copy once the refetch lands, but only while
  // viewing — clobbering a form someone is typing into would be worse than
  // showing them a value one refetch behind.
  useEffect(() => {
    if (!open || !god || mode !== 'view') return
    const next = godToForm(god)
    setForm(next)
    setInitialSig(godFormSignature(next))
  }, [god, open, mode])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirmKind) return setConfirmKind(null)
      if (mode === 'edit') return handleCancel()
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, confirmKind, mode, form])

  if (!open) return null

  const isView = mode === 'view' && !!god
  const busy = saving || deleting
  const patch = (p: Partial<GodFormState>) => setForm((f) => ({ ...f, ...p }))

  function handleCancel() {
    if (godFormSignature(form) !== initialSig) {
      setConfirmKind('discard')
      return
    }
    if (god) setMode('view')
    else onClose()
  }

  function handleDiscardConfirm() {
    const initial = god ? godToForm(god) : blankGodForm(nextSortOrder)
    setForm(initial)
    setConfirmKind(null)
    if (god) setMode('view')
    else onClose()
  }

  function commit(force: boolean) {
    const errs = validateGodForm(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    if (god && !force) {
      const msg = godSaveGuardMessage(form, god)
      if (msg) {
        setSaveGuardMsg(msg)
        setConfirmKind('save-guard')
        return
      }
    }
    onSave(toGodWrite(form))
  }

  const title = god ? (mode === 'view' ? form.name.trim() || 'God details' : 'Edit god') : 'Add god'
  const saveLabel = god ? 'Save changes' : 'Add god'

  // The server is the authority on whether a god can go: it refuses with the
  // count when poojas reference it, or when it has child categories. The button
  // reflects the count it was handed rather than guessing from another screen.
  const poojaCount = god?.poojasCount ?? 0
  const deleteDisabled = poojaCount > 0 || busy
  const deleteNote =
    poojaCount > 0
      ? `Can’t delete — ${poojaCount} pooja${poojaCount === 1 ? '' : 's'} use this god. Deactivate instead to preserve history.`
      : 'No poojas use this god, so it can be permanently deleted.'

  const homeShown = shownImage(form.homeMedia, form.homeMediaUrl, homePreview)
  const poojaShown = shownImage(form.media, form.mediaUrl, poojaPreview)

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DrawerHeader
        crumb="Gods"
        title={title}
        isView={isView}
        saveLabel={saving ? 'Saving…' : saveLabel}
        busy={busy}
        onBack={onClose}
        onEdit={() => setMode('edit')}
        onCancel={handleCancel}
        onSave={() => commit(false)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[880px] px-6 py-6.5">
          {failure && (
            <div className="mb-4">
              <Alert type="danger">{failure.message}</Alert>
            </div>
          )}

          <div className="flex flex-col gap-4.5 rounded-2xl bg-card p-6 shadow-sm">
            {isView ? (
              <>
                <div>
                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                    Name
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-ink-strong">{form.name}</div>
                </div>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                      Status
                    </div>
                    <div className="mt-1 flex items-center gap-1.75 text-lg font-medium text-ink-strong">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          form.status === 'Active' ? 'bg-success' : 'bg-stroke-strong',
                        )}
                      />
                      {form.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                      Sort order
                    </div>
                    <div className="mt-1 text-lg font-medium text-ink-strong">
                      {form.sortOrder || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                      Poojas
                    </div>
                    <div className="mt-1 text-lg font-medium text-ink-strong">{poojaCount}</div>
                  </div>
                </div>
                {(homeShown || poojaShown) && (
                  <div className="flex flex-wrap gap-5">
                    {homeShown && (
                      <div className="flex flex-col gap-1.75">
                        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                          Home screen image
                        </div>
                        <ImageUploadTile
                          image={homeShown}
                          editing={false}
                          boxClassName="w-[180px] aspect-[3/4]"
                          uploadLabel=""
                          removeLabel=""
                          onUpload={() => {}}
                          onRemove={() => {}}
                        />
                      </div>
                    )}
                    {poojaShown && (
                      <div className="flex flex-col gap-1.75">
                        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                          Pooja image
                        </div>
                        <ImageUploadTile
                          image={poojaShown}
                          editing={false}
                          boxClassName="w-[260px] aspect-[4/3]"
                          uploadLabel=""
                          removeLabel=""
                          onUpload={() => {}}
                          onRemove={() => {}}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <Input
                  label="Name"
                  required
                  placeholder="e.g. Ganesha"
                  value={form.name}
                  disabled={busy}
                  onChange={(e) => patch({ name: e.target.value })}
                  error={errors.name ?? fieldErrors.name?.[0]}
                />

                <div className="flex flex-col gap-1.75">
                  <div className="text-sm font-medium text-ink">Home screen image</div>
                  <ImageUploadTile
                    image={homeShown}
                    editing
                    boxClassName="w-[180px] aspect-[3/4]"
                    uploadLabel="Upload home screen image"
                    removeLabel="Remove home screen image"
                    hint="PNG or JPG, up to 5 MB"
                    onUpload={(file) => patch({ homeMedia: file })}
                    onRemove={() => patch({ homeMedia: null })}
                  />
                  {fieldErrors.home_media?.[0] && (
                    <div className="text-xs text-danger">{fieldErrors.home_media[0]}</div>
                  )}
                </div>

                <div className="flex flex-col gap-1.75">
                  <div className="text-sm font-medium text-ink">Pooja image</div>
                  <ImageUploadTile
                    image={poojaShown}
                    editing
                    boxClassName="w-[260px] aspect-[4/3]"
                    uploadLabel="Upload pooja image"
                    removeLabel="Remove pooja image"
                    hint="PNG or JPG, up to 5 MB"
                    onUpload={(file) => patch({ media: file })}
                    onRemove={() => patch({ media: null })}
                  />
                  {fieldErrors.media?.[0] && (
                    <div className="text-xs text-danger">{fieldErrors.media[0]}</div>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Input
                      label="Display order"
                      type="number"
                      placeholder="0"
                      value={form.sortOrder}
                      disabled={busy}
                      onChange={(e) => patch({ sortOrder: e.target.value })}
                      error={fieldErrors.sort_order?.[0]}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2.25 text-sm font-medium text-ink">Status</div>
                    <div className="flex h-8 items-center">
                      <Switch
                        checked={form.status === 'Active'}
                        label={form.status}
                        disabled={busy}
                        onChange={(e) =>
                          patch({ status: (e.target.checked ? 'Active' : 'Inactive') as GodStatus })
                        }
                      />
                    </div>
                  </div>
                </div>

                {god && (
                  <div className="mt-1 flex flex-wrap items-center gap-3.5 rounded-lg bg-card p-4 shadow-[inset_0_0_0_1px_var(--color-danger-border)]">
                    <div className="min-w-[180px] flex-1">
                      <div className="text-sm font-semibold text-ink-strong">Delete god</div>
                      <div className="mt-0.5 text-xs leading-snug text-ink-subtle">
                        {deleteNote}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={deleteDisabled}
                      onClick={() => setConfirmKind('delete')}
                      className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-danger-border bg-transparent px-3.5 text-sm font-medium text-danger-strong disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deleting ? <Spinner size={14} /> : 'Delete'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmKind === 'discard'}
        title="Discard changes?"
        body="Your unsaved changes will be lost."
        actionLabel="Discard"
        onConfirm={handleDiscardConfirm}
        onCancel={() => setConfirmKind(null)}
      />
      <ConfirmModal
        open={confirmKind === 'save-guard'}
        title="Deactivate this god?"
        body={saveGuardMsg}
        actionLabel="Save changes"
        onConfirm={() => {
          setConfirmKind(null)
          commit(true)
        }}
        onCancel={() => setConfirmKind(null)}
      />
      <ConfirmModal
        open={confirmKind === 'delete'}
        title="Delete god?"
        body={`"${god?.name ?? ''}" will be permanently removed, along with both its images. This can’t be undone.`}
        actionLabel="Delete"
        onConfirm={() => {
          if (god) onDelete?.(god.id)
          setConfirmKind(null)
        }}
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  )
}
