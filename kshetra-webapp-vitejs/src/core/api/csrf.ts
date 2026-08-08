import axios from 'axios'

import { API_PREFIX } from '@/core/config/app'
import { AUTH_ENDPOINTS } from '@/core/config/endpoints'
import { env } from '@/core/config/env'

/**
 * Django CSRF. Every unsafe method needs the `csrftoken` cookie echoed back in
 * an `X-CSRFToken` header; without it the server answers `403 "CSRF Failed"`.
 */

const CSRF_COOKIE_NAME = 'csrftoken'
export const CSRF_HEADER_NAME = 'X-CSRFToken'

export function readCsrfCookie(): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`))
  if (!match) return null
  const value = decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1))
  return value.length > 0 ? value : null
}

/**
 * Asks the server to set the cookie. Deliberately uses a bare axios call rather
 * than the shared instance so it can be invoked from that instance's own
 * interceptor without recursing.
 */
export async function fetchCsrfToken(): Promise<string | null> {
  await axios.get(`${env.apiBaseUrl}${API_PREFIX}${AUTH_ENDPOINTS.csrf}`, { withCredentials: true })
  return readCsrfCookie()
}

/** Fetches the token only if we don't already hold one. Call once at app start. */
export async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCsrfCookie()
  if (existing) return existing
  try {
    return await fetchCsrfToken()
  } catch {
    // A cold start with the API down should not block the app from rendering
    // its login screen; the first write will retry via the http interceptor.
    return null
  }
}
