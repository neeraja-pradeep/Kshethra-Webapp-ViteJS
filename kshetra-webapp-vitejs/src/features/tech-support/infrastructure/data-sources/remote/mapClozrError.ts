import axios from 'axios'

import type { WebhookFailure, WebhookFailureKind } from '@/features/tech-support/domain/entities/webhook-failure'
import { AttachmentsUnavailableError, WebhookNotConfiguredError } from '@/features/tech-support/domain/entities/webhook-failure'

/**
 * Maps a Clozr webhook response to a `WebhookFailure`.
 *
 * Both public webhooks use "Envelope A" (§1 of `docs/api/ticketing-webhook.md`):
 * `{ "status": "error", "error_code": "<code>" }` — there is no `message`, so
 * every user-facing string is ours. Confirmed against the live endpoint.
 *
 * This is the only place allowed to know that shape, as
 * `core/error/mapHttpError.ts` is for the Django dialects. It deliberately
 * never surfaces the raw body: §2 echoes per-field detail that can contain
 * what the reporter typed, and none of this is meant to reach a log.
 */

/** Every documented `error_code` across §2 and §3. */
const KNOWN_CODES: Readonly<Record<string, WebhookFailureKind>> = {
  invalid_payload: 'invalid_payload',
  invalid_signature: 'invalid_signature',
  origin_not_allowed: 'origin_not_allowed',
  key_not_found: 'key_not_found',
  payload_too_large: 'payload_too_large',
  rate_limited: 'rate_limited',
  internal_error: 'internal_error',
  length_required: 'length_required',
  unsupported_media_type: 'unsupported_media_type',
  unsupported_file_type: 'unsupported_file_type',
  replayed_request: 'replayed_request',
  upload_failed: 'upload_failed',
  service_unavailable: 'service_unavailable',
}

/**
 * Fallback when the body carried no recognisable code.
 *
 * Status alone cannot decide every case — §3 returns `415` for both
 * `unsupported_media_type` and `unsupported_file_type`, and `401` for both
 * `invalid_signature` and `replayed_request` — so `error_code` is read first
 * and this table only fills the gap. The wider of each pair is chosen here,
 * since guessing the narrower one would state a cause we cannot know.
 */
const STATUS_KIND: Readonly<Record<number, WebhookFailureKind>> = {
  400: 'invalid_payload',
  401: 'invalid_signature',
  403: 'origin_not_allowed',
  404: 'key_not_found',
  411: 'length_required',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  429: 'rate_limited',
  500: 'internal_error',
  502: 'upload_failed',
  503: 'service_unavailable',
}

const MESSAGE: Readonly<Record<WebhookFailureKind, string>> = {
  invalid_payload: 'The report could not be sent — a required field was missing or invalid.',
  invalid_signature: 'The report could not be verified. Please try again.',
  origin_not_allowed: 'This page is not permitted to send reports. Contact an administrator.',
  key_not_found: 'Reporting is not configured correctly. Contact an administrator.',
  payload_too_large: 'The report is too large to send — try removing an attachment.',
  rate_limited: 'Too many reports sent recently. Please wait a moment and try again.',
  network: 'Could not reach the support desk. Check your connection and try again.',
  not_configured: 'Reporting is not set up on this build. Contact an administrator.',
  internal_error: 'The support desk ran into a problem filing this. Please try again.',
  attachments_unavailable: 'Attachments are turned off for this workspace — the report will be sent without them.',
  length_required: 'That file could not be uploaded. Please try again.',
  unsupported_media_type: 'That file could not be uploaded. Please try again.',
  unsupported_file_type: 'That file type is not accepted. Use PNG, JPG, GIF, WebP, PDF or XLSX.',
  replayed_request: 'That upload was already sent. Please try again.',
  upload_failed: 'The file could not be stored. Please try again.',
  service_unavailable: 'The support desk is busy. Please try again in a moment.',
}

function readServerCode(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null
  const body = data as { error_code?: unknown; error?: unknown }
  const code = body.error_code ?? body.error
  return typeof code === 'string' ? code : null
}

/** `Retry-After` in seconds, when the server set one (§1 sets it on 429/503). */
function readRetryAfter(headers: unknown): number | undefined {
  if (typeof headers !== 'object' || headers === null) return undefined
  const raw = (headers as Record<string, unknown>)['retry-after']
  const seconds = Number(raw)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined
}

export function mapClozrError(error: unknown): WebhookFailure {
  // Raised before the request leaves; not a network problem, so it must not
  // be reported as one — "check your connection" would send the reporter
  // chasing a fault that is not theirs.
  if (error instanceof WebhookNotConfiguredError) {
    return { kind: 'not_configured', message: MESSAGE.not_configured }
  }

  if (error instanceof AttachmentsUnavailableError) {
    return { kind: 'attachments_unavailable', message: MESSAGE.attachments_unavailable }
  }

  if (!axios.isAxiosError(error) || !error.response) {
    return { kind: 'network', message: MESSAGE.network }
  }

  const { status, data, headers } = error.response
  // The body's own code wins: it is the only thing that separates the two
  // meanings `415` and `401` each carry. Status is the fallback, and an
  // unrecognised code is ignored rather than trusted to name a new kind.
  const serverCode = readServerCode(data)
  const kind = (serverCode ? KNOWN_CODES[serverCode] : undefined) ?? STATUS_KIND[status] ?? 'network'

  return {
    kind,
    message: MESSAGE[kind] ?? MESSAGE.network,
    status,
    retryAfterSeconds: readRetryAfter(headers),
  }
}
