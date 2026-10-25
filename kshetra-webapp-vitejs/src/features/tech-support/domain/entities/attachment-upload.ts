/**
 * Attachment uploads through the tech-support relay
 * (`POST /api/tech-support/attachments/`, see `docs/api/tech-support.md`).
 *
 * Two steps, not one: upload a file here to get an opaque token, then pass
 * that token in the ticket's `attachment_tokens` when it is submitted. A token
 * that is never redeemed is swept up server-side and the file never appears
 * anywhere — so uploading early and abandoning the form leaks nothing.
 */

/** A file that has been uploaded and is waiting to be redeemed by a ticket. */
export interface UploadedAttachment {
  /** Opaque token to send in `attachment_tokens`. Single-use. */
  token: string
  /** Seconds until the token expires — 30 minutes by default. */
  expiresIn: number
  /** When the token stops being redeemable, computed at upload time. */
  expiresAt: number
  name: string
  size: number
  /**
   * The type the *server* sniffed from the file's first bytes, which may
   * differ from what the browser reported — the server ignores the filename
   * and the declared type, both being caller-controlled.
   */
  contentType: string
}

/** True once a token can no longer be redeemed, so the UI can stop offering it. */
export function isExpired(attachment: UploadedAttachment, now: number = Date.now()): boolean {
  return now >= attachment.expiresAt
}

/**
 * The types the relay accepts, by sniffed content — SVG is deliberately absent and is
 * always rejected server-side as a stored-XSS defence, so it must not be
 * offered here either.
 */
export const ACCEPTED_CONTENT_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

/** The matching `accept` attribute for a file input. Extensions mirror the relay's table. */
export const ACCEPT_ATTRIBUTE = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.xlsx'

/**
 * The relay's cap, `TECH_SUPPORT_MAX_ATTACHMENT_BYTES` (10 MB by default),
 * less 1 KB. The cap also applies to the multipart body the relay forwards to
 * Clozr, which adds a couple of hundred bytes plus the filename, so a file
 * right at 10 MB can still be refused; the backend recommends this margin.
 * A deployment may set a *lower* cap, which the client cannot read, so an
 * upload can still come back `413` — that is handled as a failure rather than
 * pre-empted with a guess.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 - 1024

/** The relay redeems at most 10 tokens per ticket. */
export const MAX_UPLOAD_COUNT = 10

/**
 * Whether the browser's own idea of the file type is plausibly acceptable.
 *
 * Only a courtesy check to fail fast with a clear message: the server sniffs
 * content and is the authority, so a file passing here can still be rejected.
 * A file failing here would certainly be rejected, which is worth saying
 * before spending the upload.
 */
export function isPlausiblyAccepted(file: File): boolean {
  // An empty type is not a rejection — some browsers report nothing for less
  // common types, and the server will sniff it properly.
  if (!file.type) return true
  if (file.type === 'image/svg+xml') return false
  return ACCEPTED_CONTENT_TYPES.includes(file.type)
}
