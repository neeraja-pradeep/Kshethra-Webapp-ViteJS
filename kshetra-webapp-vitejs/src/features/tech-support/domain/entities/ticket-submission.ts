import type { TicketPriority } from '@/features/tech-support/domain/entities/support-ticket'

/**
 * What the screen sends to the backend relay (`POST /api/tech-support/issues/`,
 * see `docs/api/tech-support.md`).
 *
 * Only what the reporter chose. Who is reporting — name, username, role, email,
 * temple — is added by the server from the session, so none of it is sent from
 * here (the relay ignores `message`, `reported_for`, `customer_*` and
 * `custom_fields` anyway).
 */
export interface TicketSubmission {
  /** 5–280 characters after trimming — the relay rejects anything else with a 400. */
  subject: string
  /**
   * Free text. A file that failed to upload is named here as a
   * `Could not upload: …` line, because the relay has no field for it.
   */
  description?: string
  /** Sent lower case, exactly as `TicketPriority`; the server maps it to Clozr's casing. */
  priority: TicketPriority
  /** The route the reporter was on (`location.pathname`), up to 500 characters. */
  page?: string
  /**
   * Tokens from the attachments endpoint, redeemed when the ticket is filed.
   * Max 10; each expires `expires_in` seconds (30 minutes by default) after upload.
   */
  attachmentTokens?: readonly string[]
}

/**
 * The 202 body.
 *
 * `attachmentsAttached` is a count, never a per-token breakdown — when it is
 * lower than the number of files staged, some failed to upload or had expired,
 * and the screen says "N of M attached" rather than claiming success.
 */
export interface TicketSubmissionResult {
  issueId: string
  requestId: string
  attachmentsAttached: number
}
