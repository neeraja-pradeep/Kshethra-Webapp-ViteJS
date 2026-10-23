/**
 * Typed access to Vite env vars. Read once here; feature code imports these
 * constants instead of touching import.meta.env directly.
 *
 * Every value here is compiled into the public JS bundle, so only `VITE_*`
 * public configuration belongs in it — never a key or a secret. (Tech support
 * once read a Clozr webhook key here; it now goes through the backend relay at
 * `/api/tech-support/*`, which keeps the key on the server.)
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const env = {
  apiBaseUrl: API_BASE_URL,
} as const
