import { MAX_UPLOAD_BYTES } from '@/features/tech-support/domain/entities/attachment-upload'
import type { TicketDraft, TicketPriority } from '@/features/tech-support/domain/entities/support-ticket'

/** Priority choices for the select, least to most urgent. */
export const PRIORITY_OPTIONS: ReadonlyArray<{ value: TicketPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

/**
 * Largest file we will attach, matching §3's 10 MB system ceiling.
 *
 * A key may be configured with a *lower* cap that the client cannot read, so
 * a file passing this can still come back `413` — that is reported as an
 * upload failure rather than guessed at here.
 */
export const MAX_ATTACHMENT_BYTES = MAX_UPLOAD_BYTES
/**
 * Five, not §2's ceiling of ten: beyond a handful of screenshots a report is
 * a conversation, not a ticket. Kept under the server's limit on purpose, so
 * this is a product choice rather than a race against it.
 */
export const MAX_ATTACHMENTS = 5

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type TicketFormErrors = Partial<Record<'subject' | 'description' | 'attachments', string>>

export function blankTicketDraft(): TicketDraft {
  return { subject: '', description: '', priority: 'medium', attachments: [] }
}

/**
 * Only the subject is required — it is the one field support cannot work
 * without. The description is left optional on purpose: the reference screen
 * marks it so, and a required-field wall is how a bug report gets abandoned
 * rather than improved.
 */
export function validateTicketDraft(draft: TicketDraft): TicketFormErrors {
  const errors: TicketFormErrors = {}

  const subject = draft.subject.trim()
  if (!subject) errors.subject = 'Give the issue a short title.'
  else if (subject.length < 5) errors.subject = 'Too short to identify the issue.'

  return errors
}
