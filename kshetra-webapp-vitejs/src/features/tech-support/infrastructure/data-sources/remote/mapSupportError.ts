import axios from 'axios'

import type { WebhookFailure, WebhookFailureKind } from '@/features/tech-support/domain/entities/webhook-failure'
import { AttachmentsUnavailableError } from '@/features/tech-support/domain/entities/webhook-failure'

/**
 * Maps a tech-support relay failure to a `WebhookFailure`.
 *
 * The relay speaks two dialects (`docs/api/tech-support.md`, "Two error
 * shapes"), and this is the only place allowed to know them:
 *
 * | Shape                                          | Comes from                          |
 * |------------------------------------------------|-------------------------------------|
 * | `{ "status": "error", "error_code": "…" }`     | the relay itself, or Clozr via it   |
 * | `{ "detail": "…" }`                            | DRF: auth, permission, CSRF, throttle, parser |
 * | `{ "<field>": ["…"] }` (400)                   | DRF validation                      |
 *
 * `error_code` is read first; without one, the status (and for a 403 the
 * `detail`) decides. Every user-facing string is ours — the raw body is never
 * surfaced, since a 400 can echo what the reporter typed.
 */

/** Every `error_code` the relay documents. An unknown code falls back to the status. */
const KNOWN_CODES: Readonly<Record<string, WebhookFailureKind>> = {
  not_configured: 'not_configured',
  upstream_misconfigured: 'upstream_misconfigured',
  attachments_unavailable: 'attachments_unavailable',
  rate_limited: 'rate_limited',
  upstream_timeout: 'upstream_timeout',
  upstream_unavailable: 'upstream_unavailable',
  payload_too_large: 'payload_too_large',
  unsupported_file_type: 'unsupported_file_type',
  unsupported_media_type: 'unsupported_media_type',
}

/**
 * Fallback when the body carried no recognisable code — DRF's own responses,
 * or something in front of Django (nginx's HTML 413 for a body over 25 MB, a
 * 502/504 while the backend is down).
 */
const STATUS_KIND: Readonly<Record<number, WebhookFailureKind>> = {
  400: 'invalid_request',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  429: 'rate_limited',
}

const MESSAGE: Readonly<Record<WebhookFailureKind, string>> = {
  not_configured: 'Reporting is not set up on the server yet. Contact an administrator.',
  upstream_misconfigured: 'Reporting is misconfigured on the server. Contact an administrator.',
  attachments_unavailable: 'Attachments are turned off for this workspace — the report will be sent without them.',
  rate_limited: 'Too many requests sent recently. Please wait a minute and try again.',
  upstream_timeout: 'The support desk took too long to answer. Please try again in a moment.',
  upstream_unavailable: 'The support desk could not be reached. Please try again later.',
  payload_too_large: 'Too large to send — shorten the description or pick a smaller file.',
  unsupported_file_type: 'That file type is not accepted. Use PNG, JPG, GIF, WebP, PDF or XLSX.',
  unsupported_media_type: 'That file could not be uploaded. Please try again.',
  invalid_request: 'The server refused the request as invalid. Check the form and try again.',
  not_signed_in: 'Your session has expired. Please sign in again.',
  forbidden: "Your account can't send support reports. Contact an administrator.",
  csrf_failed: 'Your session needs refreshing. Reload the page and try again.',
  server_error: 'The server ran into a problem. Please try again in a moment.',
  timeout: 'The server took too long to respond. Please try again.',
  network: 'Could not reach the server. Check your connection and try again.',
  unexpected: 'Something went wrong. Please try again.',
}

function readErrorCode(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null
  const code = (data as { error_code?: unknown }).error_code
  return typeof code === 'string' ? code : null
}

function readDetail(data: unknown): string {
  if (typeof data !== 'object' || data === null) return ''
  const detail = (data as { detail?: unknown }).detail
  return typeof detail === 'string' ? detail : ''
}

/**
 * DRF's 403s carry no code, only `detail`, so the text is all there is to tell
 * them apart. `http.ts` matches "CSRF" the same way.
 */
function forbiddenKind(data: unknown): WebhookFailureKind {
  const detail = readDetail(data)
  if (detail.includes('CSRF')) return 'csrf_failed'
  if (/credentials were not provided|not authenticated/i.test(detail)) return 'not_signed_in'
  return 'forbidden'
}

/** `Retry-After` in seconds, when the server sent one as a number. */
function readRetryAfter(headers: unknown): number | undefined {
  if (typeof headers !== 'object' || headers === null) return undefined
  const seconds = Number((headers as Record<string, unknown>)['retry-after'])
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined
}

function kindFromStatus(status: number, data: unknown): WebhookFailureKind {
  if (status === 403) return forbiddenKind(data)
  if (status === 401) return 'not_signed_in'
  if (status === 504) return 'upstream_timeout'
  if (status >= 500) return 'server_error'
  return STATUS_KIND[status] ?? 'unexpected'
}

function messageFor(kind: WebhookFailureKind, retryAfterSeconds: number | undefined): string {
  if (kind === 'rate_limited' && retryAfterSeconds) {
    return `Too many requests sent recently. Please wait ${retryAfterSeconds} seconds and try again.`
  }
  return MESSAGE[kind]
}

export function mapSupportError(error: unknown): WebhookFailure {
  if (error instanceof AttachmentsUnavailableError) {
    return { kind: 'attachments_unavailable', message: MESSAGE.attachments_unavailable, status: 409 }
  }

  if (!axios.isAxiosError(error)) {
    // A 2xx body that failed schema parsing, or a programming error.
    return { kind: 'unexpected', message: MESSAGE.unexpected }
  }

  if (!error.response) {
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    return isTimeout ? { kind: 'timeout', message: MESSAGE.timeout } : { kind: 'network', message: MESSAGE.network }
  }

  const { status, data, headers } = error.response
  const code = readErrorCode(data)
  // A 404 with no relay error code means the route is not there: the backend
  // that serves `/api/tech-support/*` is not deployed yet.
  const kind =
    (code ? KNOWN_CODES[code] : undefined) ?? (status === 404 && !code ? 'not_configured' : kindFromStatus(status, data))
  const retryAfterSeconds = readRetryAfter(headers)

  return { kind, message: messageFor(kind, retryAfterSeconds), status, retryAfterSeconds }
}
