import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

import { http } from '@/core/api/http'
import { TECH_SUPPORT_ENDPOINTS } from '@/core/config/endpoints'

import type { TicketWireBody } from '@/features/tech-support/infrastructure/data-sources/remote/ticketSubmission.wire'

/**
 * The tech-support relay on our own backend (`/api/tech-support/*`,
 * contract in `docs/api/tech-support.md`).
 *
 * Goes through the shared `http` client like every other API call: the relay
 * is session-authenticated, so the request needs the session cookie
 * (`withCredentials`) and `X-CSRFToken`, and gets `http.ts`'s stale-CSRF
 * refresh-and-retry for free. The Clozr key and HMAC secret never reach the
 * browser — the server signs and forwards.
 */

/** Total tries per call, first attempt included. Each 429 retry also spends the 5/min ticket budget. */
const MAX_ATTEMPTS = 3
/** Backoff when a 429 carries no usable `Retry-After`: 800 ms, then 1600 ms. */
const BACKOFF_BASE_MS = 800
/**
 * The longest `Retry-After` waited out behind the spinner. Clozr's default is
 * 60 s and DRF's throttle often says ~40 s; holding "Send report" that long
 * reads as a hang, so past this the 429 goes to the screen, which tells the
 * reporter how long to wait. Never retries *sooner* than the server asked.
 */
const MAX_RETRY_WAIT_MS = 30_000
/**
 * The relay waits up to ~18 s for Clozr on a ticket (3.05 s connect + 15 s
 * read) — right at the shared client's 20 s default. A little headroom lets
 * the relay's own `504 upstream_timeout` arrive instead of an ambiguous
 * client-side timeout.
 */
const TICKET_TIMEOUT_MS = 30_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** `Retry-After` in ms when it is a positive number of seconds; `null` otherwise (an HTTP date, or absent). */
function retryAfterMs(header: unknown): number | null {
  const seconds = Number(header)
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null
}

function errorCodeOf(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null
  const code = (data as { error_code?: unknown }).error_code
  return typeof code === 'string' ? code : null
}

interface RetryOptions {
  /**
   * Also retry `504 upstream_timeout`. Only for the ticket, and only because
   * it carries an idempotency key: Clozr may have filed the first attempt, and
   * the same key makes it replay that ticket instead of filing a second.
   */
  retryUpstreamTimeout?: boolean
}

/**
 * `http.post`, retrying `429` with backoff (both Clozr's `rate_limited` and
 * this server's DRF throttle) and, if asked, `504 upstream_timeout`.
 *
 * Every other failure goes straight to the caller: the request is wrong, the
 * deployment is misconfigured, or waiting cannot change the answer. The
 * request config — headers included — is reused unchanged on every attempt,
 * so an `X-Idempotency-Key` stays the same across retries.
 */
export async function postWithRetry<T = unknown>(
  url: string,
  body: unknown,
  config: AxiosRequestConfig,
  options: RetryOptions = {},
): Promise<AxiosResponse<T>> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await http.post<T>(url, body, config)
    } catch (error) {
      if (!axios.isAxiosError(error) || !error.response || attempt >= MAX_ATTEMPTS) throw error
      const { status, headers, data } = error.response

      if (status === 429) {
        const waitMs = retryAfterMs(headers['retry-after']) ?? BACKOFF_BASE_MS * 2 ** (attempt - 1)
        if (waitMs > MAX_RETRY_WAIT_MS) throw error
        await sleep(waitMs)
        continue
      }
      if (options.retryUpstreamTimeout && status === 504 && errorCodeOf(data) === 'upstream_timeout') continue

      throw error
    }
  }
}

/**
 * File the ticket. `idempotencyKey` is generated once per "Send report" click
 * by the caller and reused on every retry of that click (header limit: 1–128
 * printable characters). The server prefixes it with the user id before
 * forwarding, and Clozr replays the first 202 for 24 h, so a retry returns the
 * original ticket rather than filing a second.
 */
export async function postTicket(body: TicketWireBody, idempotencyKey: string): Promise<unknown> {
  const response = await postWithRetry(
    TECH_SUPPORT_ENDPOINTS.issues,
    body,
    { headers: { 'X-Idempotency-Key': idempotencyKey }, timeout: TICKET_TIMEOUT_MS },
    { retryUpstreamTimeout: true },
  )
  return response.data
}
