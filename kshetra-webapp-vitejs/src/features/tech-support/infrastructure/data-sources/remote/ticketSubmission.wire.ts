import { z } from 'zod'

import type { TicketPriority } from '@/features/tech-support/domain/entities/support-ticket'
import type { TicketSubmission, TicketSubmissionResult } from '@/features/tech-support/domain/entities/ticket-submission'

const SUBJECT_MAX = 280
const PAGE_MAX = 500
/** The relay (and Clozr behind it) redeems at most 10 tokens per ticket. */
export const MAX_ATTACHMENT_TOKENS = 10

/**
 * The 202 body from `POST /api/tech-support/issues/`:
 * `{ issue_id, request_id, attachments_attached }`.
 *
 * `request_id` and `attachments_attached` are read leniently: a ticket was
 * created either way, so a missing value is treated as empty / zero rather
 * than a parse error.
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

/** Characters the relay accepts in `page`: RFC 3986 path, query and fragment characters. */
const PAGE_UNSAFE_CHAR = /[^A-Za-z0-9\-._~%!$&'()*+,;=:@/?#[\]]/gu

/**
 * `location.pathname` as the relay wants it: starting with `/` and with
 * anything outside the URL-path character set percent-encoded. A route is
 * normally already URL-safe; this covers a decoded segment (a space, a
 * non-Latin name) so it cannot turn a whole report into a 400.
 */
function toPagePath(raw: string): string {
  const path = raw.startsWith('/') ? raw : `/${raw}`
  return path.replace(PAGE_UNSAFE_CHAR, (char) => encodeURIComponent(char)).slice(0, PAGE_MAX)
}

/** Exactly the fields the relay reads (`docs/api/tech-support.md`). Nothing else is sent. */
export interface TicketWireBody {
  subject: string
  priority: TicketPriority
  description?: string
  page?: string
  attachment_tokens?: string[]
}

/**
 * Build the request body.
 *
 * Length caps are applied here as well as in the form, so a caller that skips
 * the form cannot draw a 400 from a field this file could have trimmed. Empty
 * optional fields are left out rather than sent blank.
 */
export function toWireBody(input: TicketSubmission): TicketWireBody {
  const body: TicketWireBody = {
    subject: input.subject.trim().slice(0, SUBJECT_MAX),
    priority: input.priority,
  }

  const description = input.description?.trim()
  if (description) body.description = description
  const page = input.page?.trim()
  if (page) body.page = toPagePath(page)
  if (input.attachmentTokens && input.attachmentTokens.length > 0) {
    body.attachment_tokens = input.attachmentTokens.slice(0, MAX_ATTACHMENT_TOKENS)
  }

  return body
}
