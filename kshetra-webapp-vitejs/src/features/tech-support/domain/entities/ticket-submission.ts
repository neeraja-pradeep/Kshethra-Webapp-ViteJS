import type { TicketPriority } from '@/features/tech-support/domain/entities/support-ticket'

/** Wire priority values Clozr accepts — capitalised exactly, unlike our own lowercase `TicketPriority`. */
export type ClozrPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export const CLOZR_PRIORITY: Readonly<Record<TicketPriority, ClozrPriority>> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

/** Who the report is about — always `self` here; the console has no notion of filing on a client's behalf. */
export type ReportedFor = 'self' | 'client'

/**
 * What the screen sends to the Clozr webhook (§2 of `docs/api/ticketing-webhook.md`).
 */
export interface TicketSubmission {
  /** ≤280 chars, required — the only field Clozr rejects the request without. */
  subject: string
  description?: string
  priority?: TicketPriority
  reportedFor?: ReportedFor
  /**
   * Lookup-only: links the ticket to an existing Customer by email. Never
   * written onto the ticket as a field, so sending it cannot leak the address
   * into ticket text — it either matches a customer or is ignored.
   */
  customerEmail?: string
  /** Lookup-only by phone, exactly as `customerEmail`. */
  customerPhone?: string
  /** Extra context folded into `form.*` on the created ticket, e.g. the page and account. */
  message?: string
  /** Merged as-is into the ticket's custom fields. */
  customFields?: Readonly<Record<string, unknown>>
  /**
   * Tokens from the attachment upload webhook (§3), redeemed when the ticket
   * is created. Max 10; each expires 30 minutes after upload.
   */
  attachmentTokens?: readonly string[]
}

/**
 * The 202 body (§2).
 *
 * `attachmentsAttached` is a count, never a per-token breakdown — when it is
 * lower than the number of tokens sent, some had expired or were already
 * used, and the screen says "N of M attached" rather than claiming success.
 */
export interface TicketSubmissionResult {
  issueId: string
  requestId: string
  attachmentsAttached: number
}
