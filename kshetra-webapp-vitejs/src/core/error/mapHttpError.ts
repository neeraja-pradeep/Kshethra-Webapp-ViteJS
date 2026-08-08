import axios from 'axios'
import { ZodError } from 'zod'

import type { Failure, FieldErrors } from '@/core/error/failure'

/**
 * Turns anything thrown by the API layer into a `Failure`.
 *
 * The backend speaks three different error dialects and this is the only place
 * that is allowed to know that:
 *
 * | Shape                                   | Comes from            |
 * |-----------------------------------------|-----------------------|
 * | `{ "lines": ["Line 0: unknown ref"] }`  | serializer validation |
 * | `{ "error": "...", "receipt_no": "…" }` | a business rule       |
 * | `{ "detail": "..." }`                   | a permission denial   |
 */

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'
const NETWORK_MESSAGE = 'Could not reach the server. Check your connection and try again.'
const TIMEOUT_MESSAGE = 'The server took too long to respond.'
const SERVER_MESSAGE = 'The server ran into a problem. Please try again in a moment.'
const SCHEMA_MESSAGE = 'The server sent a response this app did not understand.'
const UNAUTHORIZED_MESSAGE = 'Your session has expired. Please sign in again.'
const FORBIDDEN_MESSAGE = "You don't have access to do that."
const NOT_FOUND_MESSAGE = 'That record could not be found.'

/** Keys that carry the message itself rather than extra context. */
const MESSAGE_KEYS = ['error', 'detail', 'message'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** DRF sends `["msg"]`, `"msg"`, or nested objects. Flatten all three to strings. */
function toMessages(value: unknown): readonly string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(toMessages)
  if (isRecord(value)) return Object.values(value).flatMap(toMessages)
  return []
}

function readFieldErrors(body: Record<string, unknown>): FieldErrors {
  const entries = Object.entries(body)
    .filter(([key]) => !MESSAGE_KEYS.includes(key as (typeof MESSAGE_KEYS)[number]))
    .map(([key, value]) => [key, toMessages(value)] as const)
    .filter(([, messages]) => messages.length > 0)
  return Object.fromEntries(entries)
}

/** Everything that is neither a message nor a field error — e.g. `receipt_no`. */
function readDetails(body: Record<string, unknown>, fieldErrors: FieldErrors): Record<string, unknown> | undefined {
  const entries = Object.entries(body).filter(
    ([key]) => !MESSAGE_KEYS.includes(key as (typeof MESSAGE_KEYS)[number]) && !(key in fieldErrors),
  )
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function readMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim()) return body.trim()
  if (!isRecord(body)) return null
  for (const key of MESSAGE_KEYS) {
    const messages = toMessages(body[key])
    if (messages[0]) return messages[0]
  }
  return null
}

export function mapHttpError(error: unknown): Failure {
  // A response that did not match its schema is a contract break, not a user error.
  if (error instanceof ZodError) {
    return { kind: 'server', message: SCHEMA_MESSAGE, details: { issues: error.issues } }
  }

  if (!axios.isAxiosError(error)) {
    return { kind: 'unknown', message: error instanceof Error ? error.message : GENERIC_MESSAGE }
  }

  const response = error.response
  if (!response) {
    // axios reports its own timeout as ECONNABORTED (ETIMEDOUT on some adapters).
    // The request did leave, so the caller must treat a write as "unknown", not
    // "failed" — retrying could duplicate it.
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    return isTimeout ? { kind: 'timeout', message: TIMEOUT_MESSAGE } : { kind: 'network', message: NETWORK_MESSAGE }
  }

  const { status, data } = response
  const body = isRecord(data) ? data : {}
  const message = readMessage(data)

  if (status === 401) return { kind: 'unauthorized', message: message ?? UNAUTHORIZED_MESSAGE, status }
  if (status === 403) return { kind: 'forbidden', message: message ?? FORBIDDEN_MESSAGE, status }
  if (status === 404) return { kind: 'notFound', message: message ?? NOT_FOUND_MESSAGE, status }

  if (status >= 500) return { kind: 'server', message: SERVER_MESSAGE, status }

  if (status >= 400) {
    const fieldErrors = readFieldErrors(body)
    // A flat `{ "error": ... }` body has no field errors — its message is the whole story.
    const firstFieldMessage = Object.values(fieldErrors)[0]?.[0]
    return {
      kind: 'validation',
      message: message ?? firstFieldMessage ?? GENERIC_MESSAGE,
      status,
      fieldErrors,
      details: readDetails(body, fieldErrors),
    }
  }

  return { kind: 'unknown', message: message ?? GENERIC_MESSAGE, status }
}
