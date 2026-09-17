/**
 * A technical issue an admin-console user reports about the console itself.
 *
 * Frontend-only for now: nothing is persisted, so these shapes describe what
 * the form collects rather than a wire contract. When the API lands, this file
 * is the seam — the screen already reads these names.
 */

/** How badly the reporter is blocked. */
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * An image the reporter attached — a screenshot of the error, almost always.
 *
 * `url` is an object URL over the picked File, which is why the screen revokes
 * it on removal: without that, every discarded screenshot leaks for the life of
 * the tab.
 */
export interface TicketAttachment {
  id: string
  name: string
  /** Bytes, for the size caption and the oversize guard. */
  size: number
  /** Object URL for the preview. */
  url: string
  /** The picked file, uploaded to the attachment webhook as soon as it is added. */
  file: File
  /**
   * Where this file is in the two-step flow (§3 upload, then §2 redeem).
   *
   * Files are only uploaded when the report is actually sent. Uploading on
   * pick would push a file to the server that the reporter may still remove,
   * and would surface an upload failure as an alarming banner before they had
   * asked for anything — attaching a file is not consent to transmit it.
   * It also keeps the 30-minute token life measured from the click, not from
   * however long the reporter spent writing.
   */
  status: 'staged' | 'uploading' | 'uploaded' | 'failed'
  /** Set once uploaded — what §2 redeems. Absent while uploading or after a failure. */
  token?: string
  /** When the token stops being redeemable, so a stale one is not sent. */
  expiresAt?: number
  /** Why the upload failed, shown on the thumbnail. */
  error?: string
}

/** What the form collects before it becomes a report. */
export interface TicketDraft {
  subject: string
  description: string
  priority: TicketPriority
  attachments: TicketAttachment[]
}
