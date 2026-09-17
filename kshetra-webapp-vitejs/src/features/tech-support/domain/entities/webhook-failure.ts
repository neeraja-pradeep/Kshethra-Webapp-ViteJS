/**
 * Every failure the Clozr inbound webhook can hand back, named after its own
 * error codes rather than reused from `core/error/failure.ts`.
 *
 * The two do not line up cleanly enough to share a type: `key_not_found` is a
 * `404` that means nothing like this app's usual "no such record", and
 * `payload_too_large` / `rate_limited` have no equivalent at all in the shared
 * `Failure` union. Bending that union to fit one third-party integration would
 * make it wrong for every other caller, so this ticket submission gets its own.
 */
export type WebhookFailureKind =
  /** `400` — bad JSON, or a required field missing/invalid. Fix the payload. */
  | 'invalid_payload'
  /** `401` — signature did not match the body. Never retry as-is. */
  | 'invalid_signature'
  /** `403` — this page's Origin is not on the key's allowlist. */
  | 'origin_not_allowed'
  /** `404` — the key itself is wrong, revoked, or inactive. */
  | 'key_not_found'
  /** `413` — body over 32 KB (almost always the attachments; none are sent yet). */
  | 'payload_too_large'
  /** `429` — over the key's per-minute limit. The only kind worth retrying. */
  | 'rate_limited'
  /** The request never reached Clozr, or the response made no sense. */
  | 'network'
  /**
   * The app is misconfigured — `CLOZR_ISSUE_KEY` is unset, so there is no
   * inbox to post to. Distinct from `network` because the reporter's
   * connection is fine and retrying cannot help; someone has to set the
   * variable and rebuild.
   */
  | 'not_configured'
  /** §3 `411` — no usable `Content-Length` (e.g. chunked upload). */
  | 'length_required'
  /** §3 `415` — body was not `multipart/form-data`. */
  | 'unsupported_media_type'
  /** §3 `415` — file content matched no accepted type. SVG always lands here. */
  | 'unsupported_file_type'
  /** §3 `401` — the upload nonce was replayed (HMAC mode only). */
  | 'replayed_request'
  /** §3 `502` — storage/CDN error receiving the file. Safe to retry. */
  | 'upload_failed'
  /** §3 `503` — briefly at capacity. Safe to retry shortly. */
  | 'service_unavailable'
  /** §2 `500` — unhandled server error creating the ticket. */
  | 'internal_error'
  /**
   * The key is valid but has `attachments_enabled: false`. Distinct from
   * `key_not_found` even though §3 returns the same 404 for both: reporting
   * itself works, so telling someone it is misconfigured would be false.
   */
  | 'attachments_unavailable'

export interface WebhookFailure {
  readonly kind: WebhookFailureKind
  /** User-safe, already-humanised. Never the raw server body. */
  readonly message: string
  readonly status?: number
  /** From the `Retry-After` header, when the server sent one (429/503). */
  readonly retryAfterSeconds?: number
}

/**
 * Which failures are worth another attempt.
 *
 * `rate_limited` is the documented retry case. §3 adds two transient
 * server-side ones — `upload_failed` (storage hiccup) and
 * `service_unavailable` (capacity), both explicitly marked retryable in the
 * doc. Everything else means the request itself is wrong, and repeating it
 * only repeats the rejection.
 */
export function isRetryable(kind: WebhookFailureKind): boolean {
  return kind === 'rate_limited' || kind === 'upload_failed' || kind === 'service_unavailable'
}

/**
 * Thrown before any request when the webhook key is missing.
 *
 * A named class rather than a bare `Error` so the mapper can recognise it
 * without matching on message text, which would break the moment the wording
 * changes. Carries no key material — there is none to carry.
 */
export class AttachmentsUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AttachmentsUnavailableError'
  }
}

export class WebhookNotConfiguredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookNotConfiguredError'
  }
}
