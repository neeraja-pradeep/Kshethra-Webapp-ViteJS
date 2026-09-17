import axios from 'axios'

import { clozrWebhookPath } from '@/core/config/endpoints'
import { env } from '@/core/config/env'

import { WebhookNotConfiguredError } from '@/features/tech-support/domain/entities/webhook-failure'

/**
 * A standalone client for the Clozr inbound webhook — deliberately NOT the
 * app's shared `http` instance (`core/api/http.ts`).
 *
 * That client is `withCredentials: true` and CSRF-armed because it talks to
 * our own session-authenticated Django API; Clozr is a different origin
 * entirely, authenticated by an Origin allowlist rather than a session, so
 * sending cookies or a CSRF header there would be both useless and a
 * needless leak of this app's session cookie to a third party.
 */
export const clozrWebhookClient = axios.create({
  baseURL: env.clozrWebhookBaseUrl,
  // No `withCredentials`, no CSRF interceptor — see above.
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

const RETRYABLE_STATUS = 429
const MAX_ATTEMPTS = 3
/** Base delay for the 429 backoff. 800ms, 1600ms, then give up. */
const BACKOFF_BASE_MS = 800


/**
 * Set once a request with `X-Idempotency-Key` is blocked before reaching the
 * server, so later submissions in this session skip the header instead of
 * paying for a failed round trip each time.
 *
 * Module-level and deliberately not reset: the CORS allow-list is a property
 * of the deployment, and it cannot change mid-session. When the header is
 * allow-listed this stays `false` and every request carries it, which is the
 * intended path — de-duplication only works with the header.
 */
let headerBlocked = false

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * `Retry-After` if Clozr sent one (seconds, per the header's spec), else
 * exponential backoff from our own attempt count.
 */
function delayFor(attempt: number, retryAfterHeader: unknown): number {
  const retryAfterSeconds = Number(retryAfterHeader)
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) return retryAfterSeconds * 1000
  return BACKOFF_BASE_MS * 2 ** (attempt - 1)
}

/**
 * POST the webhook body, retrying only `429 rate_limited` with backoff.
 *
 * Every other failure (400/401/403/404/413, or no response at all) is handed
 * straight to the caller on the first attempt — the request itself is wrong
 * or the situation cannot change by waiting, so retrying would just repeat
 * the same rejection while holding the reporter's "Send report" click open.
 *
 * The idempotency key is generated once by the caller and reused across every
 * attempt in this call, including the retries — that is the whole point of
 * sending it: a 429 retry must not read to Clozr as a second submission. §2
 * caches the original response against this key for 24 hours and replays it
 * verbatim, so a retry returns the first ticket rather than filing a second.
 *
 * The header needs `x-idempotency-key` in the key's CORS allow-list. Some
 * deployments do not have it, and a browser told to send a header the
 * preflight refuses never issues the POST at all. So the first blocked
 * attempt retries once without it, and remembers — see `headerBlocked`.
 */
export async function postToClozrWebhook(body: unknown, idempotencyKey: string): Promise<unknown> {
  // Without a key the URL would be `/webhooks/issues//` — a 404 from Clozr
  // that reads as "wrong or revoked key" and sends whoever is debugging it
  // hunting for a revoked key rather than an unset variable. Fail here, where
  // the cause is nameable, and never put the key itself in the message.
  if (!env.clozrIssueKey) {
    throw new WebhookNotConfiguredError('CLOZR_ISSUE_KEY is not set — reports cannot be submitted.')
  }

  const path = clozrWebhookPath(env.clozrIssueKey)
  let attempt = 0
  for (;;) {
    attempt += 1
    try {
      const response = await clozrWebhookClient.post(path, body, {
        headers: headerBlocked ? undefined : { 'X-Idempotency-Key': idempotencyKey },
      })
      return response.data
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const status = isAxios ? error.response?.status : undefined

      /*
       * A CORS-blocked preflight is indistinguishable from an offline network
       * from JS — both arrive as an axios error with no `response`. The one
       * thing that separates them here is that we asked for a non-default
       * header: if that attempt produced no response at all, the allow-list
       * is the likely cause, so drop the header and try once more. A genuine
       * outage simply fails again on the retry.
       */
      if (isAxios && !error.response && !headerBlocked) {
        headerBlocked = true
        continue
      }

      const retryAfter = isAxios ? error.response?.headers?.['retry-after'] : undefined
      const canRetry = status === RETRYABLE_STATUS && attempt < MAX_ATTEMPTS
      if (!canRetry) throw error
      await sleep(delayFor(attempt, retryAfter))
    }
  }
}
