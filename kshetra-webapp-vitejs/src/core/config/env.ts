/**
 * Typed access to Vite env vars. Read once here; feature code imports these
 * constants instead of touching import.meta.env directly.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * The Clozr inbound webhook — a different service from the Django API above,
 * reached directly from the browser rather than through the `/api` proxy.
 * Auth is Origin allowlisting on Clozr's side, not session cookies, so this
 * must never be routed through the app's `http` client (`withCredentials`
 * would leak the session cookie to a third-party origin for no reason).
 */
const CLOZR_WEBHOOK_BASE_URL = import.meta.env.VITE_CLOZR_WEBHOOK_BASE_URL ?? ''

/**
 * The webhook key — the path segment identifying which Clozr inbox a report
 * lands in. Set as `CLOZR_ISSUE_KEY` (no `VITE_` prefix), so it reaches the
 * bundle through `define` in `vite.config.ts` rather than `import.meta.env`.
 *
 * Not a secret despite the name: this webhook authenticates by Origin
 * allowlist, so the key alone grants nothing from an unregistered origin. It
 * is configuration because it differs per environment, not because it is
 * sensitive — which is also why it is safe to inline into client code.
 */
const CLOZR_ISSUE_KEY = typeof __CLOZR_ISSUE_KEY__ === 'string' ? __CLOZR_ISSUE_KEY__ : ''

export const env = {
  apiBaseUrl: API_BASE_URL,
  clozrWebhookBaseUrl: CLOZR_WEBHOOK_BASE_URL,
  clozrIssueKey: CLOZR_ISSUE_KEY,
} as const
