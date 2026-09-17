/**
 * Build-time constants injected by `define` in `vite.config.ts`.
 *
 * These come from unprefixed env vars, which Vite deliberately keeps off
 * `import.meta.env` — `define` is the supported way to pass one through, so
 * it needs a matching ambient declaration to be visible to TypeScript.
 */

/** The Clozr webhook key — the path segment of the inbound issues endpoint. */
declare const __CLOZR_ISSUE_KEY__: string
