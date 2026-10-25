/**
 * Every failure the tech-support relay (`/api/tech-support/*`) can hand back,
 * named after its own `error_code`s rather than reused from
 * `core/error/failure.ts`. Contract: `docs/api/tech-support.md`.
 *
 * The relay answers in two shapes. Its own and Clozr's failures use
 * `{ "status": "error", "error_code": "<code>" }` with no message; DRF's own
 * refusals (auth, permission, CSRF, throttle, validation, parser) keep DRF's
 * `{ "detail": "…" }` or field-map shape. Codes such as
 * `attachments_unavailable` or `upstream_misconfigured` have no equivalent in
 * the shared `Failure` union, so this feature keeps its own.
 */
export type WebhookFailureKind =
  /** `503 not_configured` — the server has no Clozr key/secret. Don't retry. */
  | 'not_configured'
  /** `502 upstream_misconfigured` — Clozr refused the relay's credentials. Don't retry. */
  | 'upstream_misconfigured'
  /** `409 attachments_unavailable` — attachments are off for the key. Send without files. */
  | 'attachments_unavailable'
  /** `429` — Clozr's `rate_limited`, or this server's own DRF throttle. Honour `Retry-After`. */
  | 'rate_limited'
  /** `504 upstream_timeout` — Clozr did not answer in time. Retryable. */
  | 'upstream_timeout'
  /** `502 upstream_unavailable` — Clozr unreachable or 5xx. Retryable later. */
  | 'upstream_unavailable'
  /** `413 payload_too_large` — ticket over 32 KB or file over 10 MB (or nginx's own 413). */
  | 'payload_too_large'
  /** `415 unsupported_file_type` — the file's bytes are not an accepted type. SVG always lands here. */
  | 'unsupported_file_type'
  /** `415 unsupported_media_type`, or DRF's 415 for a body it cannot parse. */
  | 'unsupported_media_type'
  /** DRF `400` field map — e.g. a subject that is too short. */
  | 'invalid_request'
  /** DRF `403` "Authentication credentials were not provided." — the session is gone. */
  | 'not_signed_in'
  /** DRF `403` permission denial — the account lacks `rbac.access_admin_portal`. */
  | 'forbidden'
  /** DRF `403` "CSRF Failed" that survived `http.ts`'s one refresh-and-retry. */
  | 'csrf_failed'
  /** A 5xx with no `error_code` — Django or nginx, not the relay. */
  | 'server_error'
  /** The client gave up waiting (axios timeout). */
  | 'timeout'
  /** The request never reached the server. */
  | 'network'
  /** Anything else, including a 2xx body this app cannot read. */
  | 'unexpected'

export interface WebhookFailure {
  readonly kind: WebhookFailureKind
  /** User-safe, already-humanised. Never the raw server body. */
  readonly message: string
  readonly status?: number
  /** From the `Retry-After` header, when the server sent one (429, some 502s). */
  readonly retryAfterSeconds?: number
}

/**
 * Which failures are worth another attempt later.
 *
 * Everything else means the request itself is wrong or the deployment is
 * misconfigured, and repeating it only repeats the rejection.
 */
export function isRetryable(kind: WebhookFailureKind): boolean {
  return (
    kind === 'rate_limited' ||
    kind === 'upstream_timeout' ||
    kind === 'upstream_unavailable' ||
    kind === 'server_error' ||
    kind === 'timeout' ||
    kind === 'network'
  )
}

/**
 * Thrown by the upload call on `409 attachments_unavailable`.
 *
 * A named class rather than a bare `Error` so the mapper and the screen can
 * recognise it without matching on message text: the screen stops uploading
 * the remaining files and sends the ticket without them.
 */
export class AttachmentsUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AttachmentsUnavailableError'
  }
}
