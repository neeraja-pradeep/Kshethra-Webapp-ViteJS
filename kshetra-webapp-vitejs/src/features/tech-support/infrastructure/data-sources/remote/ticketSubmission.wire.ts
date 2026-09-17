import { z } from 'zod'

import { CLOZR_PRIORITY } from '@/features/tech-support/domain/entities/ticket-submission'
import type { TicketSubmission, TicketSubmissionResult } from '@/features/tech-support/domain/entities/ticket-submission'

const SUBJECT_MAX = 280
const CUSTOMER_EMAIL_MAX = 254
const CUSTOMER_PHONE_MAX = 50
/** §2 redeems at most 10 tokens per ticket. */
export const MAX_ATTACHMENT_TOKENS = 10

/**
 * The 202 body, per §2 of `docs/api/ticketing-webhook.md`:
 * `{ status, request_id, issue_id, attachments_attached }`.
 *
 * `attachments_attached` is optional because it is only meaningful when
 * tokens were sent; treat a missing value as zero rather than a parse error,
 * since a ticket was still created either way.
 */
export const ticketSubmissionResponseSchema = z.object({
  issue_id: z.union([z.string(), z.number()]).transform(String),
  request_id: z.union([z.string(), z.number()]).transform(String).optional(),
  attachments_attached: z.number().optional(),
})

export type TicketSubmissionResponseDto = z.infer<typeof ticketSubmissionResponseSchema>

export function toTicketSubmissionResult(dto: TicketSubmissionResponseDto): TicketSubmissionResult {
  return {
    issueId: dto.issue_id,
    requestId: dto.request_id ?? '',
    attachmentsAttached: dto.attachments_attached ?? 0,
  }
}

/**
 * Build the §2 request body.
 *
 * Length caps are applied here as well as in the form: a caller that skips
 * the form (a retry path, a script) should not be able to draw an
 * `invalid_payload` from a field this file could have trimmed. Empty optional
 * fields are omitted entirely rather than sent blank — the server treats a
 * blank string as a value, and an empty `customer_email` would be a failed
 * lookup rather than no lookup.
 */
export function toWireBody(input: TicketSubmission): Record<string, unknown> {
  const body: Record<string, unknown> = {
    subject: input.subject.trim().slice(0, SUBJECT_MAX),
  }

  if (input.description?.trim()) body.description = input.description.trim()
  if (input.priority) body.priority = CLOZR_PRIORITY[input.priority]
  if (input.reportedFor) body.reported_for = input.reportedFor
  if (input.customerEmail?.trim()) {
    body.customer_email = input.customerEmail.trim().slice(0, CUSTOMER_EMAIL_MAX)
  }
  if (input.customerPhone?.trim()) {
    body.customer_phone = input.customerPhone.trim().slice(0, CUSTOMER_PHONE_MAX)
  }
  if (input.message?.trim()) body.message = input.message.trim()
  if (input.customFields && Object.keys(input.customFields).length > 0) {
    body.custom_fields = input.customFields
  }
  if (input.attachmentTokens && input.attachmentTokens.length > 0) {
    body.attachment_tokens = input.attachmentTokens.slice(0, MAX_ATTACHMENT_TOKENS)
  }

  return body
}
