import axios from 'axios'
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

import { API_PREFIX, API_TIMEOUT_MS } from '@/core/config/app'
import { env } from '@/core/config/env'

import { CSRF_HEADER_NAME, fetchCsrfToken, readCsrfCookie } from '@/core/api/csrf'

/**
 * The app's single HTTP client.
 *
 * Auth is session cookies, not bearer tokens — `withCredentials` is what makes
 * every request work at all, and dropping it turns the whole API into 403s.
 */

const UNSAFE_METHODS = ['post', 'put', 'patch', 'delete'] as const
const CSRF_FAILURE_MARKER = 'CSRF'

/** Requests we have already re-sent once, so a bad token can't loop. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  hasRetriedCsrf?: boolean
}

export const http = axios.create({
  baseURL: `${env.apiBaseUrl}${API_PREFIX}`,
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

function isUnsafe(method: string | undefined): boolean {
  return UNSAFE_METHODS.includes((method ?? 'get').toLowerCase() as (typeof UNSAFE_METHODS)[number])
}

http.interceptors.request.use((config) => {
  if (isUnsafe(config.method)) {
    const token = readCsrfCookie()
    if (token) config.headers.set(CSRF_HEADER_NAME, token)
  }
  return config
})

/**
 * Session expiry is a whole-app concern, but `core/` must not import the router
 * or the query cache. The composition root registers what should happen instead.
 */
type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

/** True for the `403 { detail: "CSRF Failed: ..." }` Django sends on a stale token. */
function isCsrfFailure(data: unknown): boolean {
  if (typeof data === 'string') return data.includes(CSRF_FAILURE_MARKER)
  if (typeof data !== 'object' || data === null) return false
  const detail = (data as { detail?: unknown }).detail
  return typeof detail === 'string' && detail.includes(CSRF_FAILURE_MARKER)
}

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response) throw error

    const { status, data } = error.response
    const config = error.config as RetriableConfig | undefined

    // A stale CSRF token is recoverable: refresh it and re-send, exactly once.
    if (status === 403 && isCsrfFailure(data) && config && !config.hasRetriedCsrf) {
      config.hasRetriedCsrf = true
      const token = await fetchCsrfToken().catch(() => null)
      if (token) {
        config.headers.set(CSRF_HEADER_NAME, token)
        return http.request(config as AxiosRequestConfig)
      }
    }

    if (status === 401) onUnauthorized?.()

    throw error
  },
)
