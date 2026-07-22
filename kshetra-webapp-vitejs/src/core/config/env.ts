/**
 * Typed access to Vite env vars. Read once here; feature code imports these
 * constants instead of touching import.meta.env directly.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const env = {
  apiBaseUrl: API_BASE_URL,
} as const
