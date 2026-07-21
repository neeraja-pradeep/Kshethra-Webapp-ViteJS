# Claude Code — Generic Feature Prompt Pack (React + Vite)

Three copy‑paste prompts for building any React feature with Claude Code on our
standard repo:

1. **Prompt A — Feature Layer Generation** (the main one; generates Domain +
   Infrastructure + Application for one feature).
2. **Prompt A‑AUTH — Auth Add‑on** (paste *in addition to* Prompt A only when the
   feature is authentication/session).
3. **Prompt B — Bug Fix** (strict, surgical fix from a reported UI/console error).

> Assumptions baked in (from our standards docs):
> Feature‑first Clean Architecture per `REACT_VITEJS_FEATURE_PROMPTS.md` ·
> Coding rules per `REACT_VITEJS_CODING_STANDARDS.md` ·
> TanStack Query (server state) + Zustand (client state) · Axios · TypeScript (strict) ·
> Zod (response validation at the boundary) · React Router · ESLint + Prettier ·
> The feature's **presentation layer is already developed** to the coding standards ·
> QA gate = lint + tsc + tests + build, all zero‑error.

---

## How to use

1. Make sure the repo contains: `REACT_VITEJS_FEATURE_PROMPTS.md` and
   `REACT_VITEJS_CODING_STANDARDS.md` (in the repo or alongside it), the target
   feature's **presentation layer already generated** (static UI, standards-compliant),
   and the `core/` + `app/` + `shared/` scaffolding.
2. Open Claude Code at the **React project root**.
3. Copy **Prompt A**, set `FEATURE_NAME`, and paste the feature's **API contract**
   (from the backend documentation) into the `API CONTRACT` block.
4. If the feature is auth/session, also append **Prompt A‑AUTH**.
5. After the developer tests, if something breaks, use **Prompt B** with the exact
   UI + console/network errors.

---

## PROMPT A — Feature Layer Generation

```text
You are a senior React + TypeScript engineer working in an existing, standardized
repository. Architecture is feature-first Clean Architecture. Server state uses
TanStack Query; client/UI state uses Zustand. You will build the non-UI layers for
ONE feature only.

================================================================
FEATURE_NAME: <<e.g. authentication / dashboard / profile>>
================================================================

STEP 0 — READ BEFORE WRITING (do not skip, do not assume)
1. Read the standards documents. These are BINDING:
   - REACT_VITEJS_FEATURE_PROMPTS.md     (architecture, folder structure, layer roles)
   - REACT_VITEJS_CODING_STANDARDS.md    (naming, TypeScript, state-management,
                                          layer, error-handling, lint rules)
   - package.json                        (pinned dependency versions — use these EXACT ones)
   - tsconfig.json + vite.config.*       (strict mode, path aliases)
   - eslint config + prettier config     (lint/format rules)
2. Read the feature's ALREADY-DEVELOPED presentation layer:
   `src/features/<FEATURE_NAME>/presentation/`  (screens + components).
   Infer from the UI exactly what data fields, states (loading/empty/error/success),
   and actions each screen needs. The presentation layer is the contract for what
   your layers must supply.
3. Read existing shared scaffolding before creating anything:
   `src/core/` (api/axios instance + interceptors, error/Failure + Result,
   config/endpoint constants, storage wrappers) and `src/app/` (providers incl.
   QueryClient setup, router).

STEP 1 — SOURCE OF TRUTH FOR THE BACKEND
Use ONLY the API contract below (taken from the backend documentation). Do not invent
endpoints, fields, or response shapes. If the UI needs a field the contract does not
provide, STOP and list the gap instead of guessing.

----------------- API CONTRACT (filled in by the developer) -----------------
Base URL / env var:
Auth scheme (session-cookie / bearer / none):

For each endpoint:
  - Name / purpose:
  - Method + path:
  - Headers (auth, csrf, content-type):
  - Path / query params:
  - Request body (JSON example):
  - Success response (HTTP code + JSON example):
  - Error responses (codes + JSON example):
  - Pagination (if any):
<<PASTE ALL ENDPOINTS FOR THIS FEATURE HERE>>
-----------------------------------------------------------------------------

STEP 2 — WHAT TO BUILD (this feature only)
Generate these layers under `src/features/<FEATURE_NAME>/`:

A) domain/  (DECLARE)
   - entities/        Plain immutable TS types/interfaces the UI needs
                      (`readonly` fields; no methods, no React, no Axios).
   - repositories/    ABSTRACT repository(ies) only — a TS interface
                      (`<feature>.repository.ts`) with method signatures, no bodies.
                      Return `Promise<Result<T>>` (or the project's existing
                      Result/Failure type — match what core/error already uses).

B) infrastructure/  (DEFINE)
   - data-sources/remote/   `<feature>.api.ts` — Axios calls. DTOs as
                            `*.request.ts` / `*.response.ts` with Zod schemas,
                            inferred types, and `toEntity()` mappers. Validate EVERY
                            response with Zod before it enters the app. DTOs never
                            leak above this layer.
   - data-sources/local/    `<feature>.local.ts` — localStorage/IndexedDB read/write,
                            ONLY if the feature genuinely needs caching (use
                            core/storage wrappers; keys via constants; never magic
                            strings).
   - repositories/          `<feature>.repository.impl.ts` — implements the domain
                            interface, joins remote + local, validates responses
                            before caching, maps every error to a typed Failure via
                            core/error. Never throws raw Axios errors upward.

C) application/  (CALL)
   - usecases/    One file per action (`fetchX.ts` -> `fetchX`), thin, calls the
                  repository ONLY. File verb == function verb. No React in here.
   - queries/     TanStack Query wiring: `useXQuery` / `useXMutation` hooks that call
                  usecases. Centralize query keys in `<feature>.keys.ts` (key factory —
                  no inline key arrays anywhere). Set sensible staleTime per query;
                  every mutation invalidates the keys it affects. This layer OWNS
                  server loading/success/error/empty — do not duplicate it in Zustand.
   - store/       Zustand slice (`<feature>.store.ts`) for CLIENT/UI state only
                  (filters, selected ids, modal open, wizard step). Typed state +
                  actions defined in the store; components read via selectors.
                  NEVER put server data in here.

STEP 3 — WIRE THE PRESENTATION (bounded — read carefully)
Connect the existing screens/components to the new hooks with the MINIMUM edits:
  - Replace static/dummy data with `useXQuery()` reads and Zustand selectors.
  - Add loading / error / empty handling using the existing shared/ui components and
    the query's `isLoading / isError / data` flags. Empty is a state, not an accident.
  - Hook buttons/forms to mutation hooks and store actions.
You MUST NOT change layout, styling, JSX structure, copy, colors, spacing, or any
className/style values. Do not touch any OTHER feature's presentation. List every
presentation file you edited and what changed (one line each).
(If you prefer to wire manually, delete STEP 3 before running this prompt.)

STEP 4 — HARD RULES (these are also lint/review failures — full detail in
REACT_VITEJS_CODING_STANDARDS.md, which prevails on any conflict)
- Dependency direction: presentation -> application -> domain; infrastructure ->
  domain. Domain imports NOTHING from other layers. Presentation never imports
  Axios/storage/data-sources directly.
- TanStack Query: server data lives ONLY in the query cache, never copied into
  Zustand or useState; query keys ONLY from the key factory; mutations invalidate
  affected keys; no fetching in render bodies or useEffect — only via query hooks.
- Zustand: client/UI state ONLY; actions defined inside the store; components read
  with selectors (never subscribe to the whole store); persist only with explicit
  reason, never tokens or server data.
- DTOs/entities: every response Zod-validated at the infrastructure boundary; DTO ->
  entity mapping before returning upward; entity fields `readonly`; no `any`.
- TypeScript: strict mode; no `any`; no unsafe non-null `!`; prefer `??`, `?.`,
  discriminated unions for multi-shape states; path-alias imports (no `../../..`).
- Naming: obey the standards doc (PascalCase components/types, camelCase functions,
  `use*` hooks, `*Query`/`*Mutation` suffixes, `<feature>.api.ts` / `.store.ts` /
  `.keys.ts` / `.repository.impl.ts` file patterns, UPPER_SNAKE constants, boolean
  `is/has/can` prefixes; one component per file; one usecase per file).
- No magic numbers/strings — constants in core/config or top of file. No console.log.
  Errors surfaced to UI must be user-safe.
- Use ONLY the dependency versions in package.json. Do not add a new dependency
  without flagging it and justifying it.
- Reuse core/ + app/ + shared/ scaffolding. Create a shared piece ONLY if it is
  missing; if you create one, follow the folder structure doc and report it explicitly.

STEP 5 — SELF-VERIFY BEFORE YOU FINISH (the QA gate)
Run / reason through and report results:
  - `npm run format` (Prettier)        -> applied
  - `npm run lint` (ESLint)            -> ZERO errors & warnings
  - `npx tsc --noEmit`                 -> ZERO type errors
  - `npm test`                         -> passing (if tests exist)
  - `npm run build` (vite build)       -> succeeds
Then self-audit against the checklist in REACT_VITEJS_CODING_STANDARDS.md
(Section: "Quick self-review checklist") and fix any CRITICAL or HIGH finding
before reporting done.

STEP 6 — OUTPUT
1. A file tree of everything you created/edited (grouped by layer).
2. The code, file by file.
3. The verification results from STEP 5.
4. Any gaps where the API contract was insufficient (do NOT guess).
5. Any shared core/app/shared file you had to create, and why.

Build the <FEATURE_NAME> feature now.
```

---

## PROMPT A‑AUTH — Authentication / Session Add‑on

> Append this to **Prompt A** only when `FEATURE_NAME` is authentication/login/session.
> It overrides anything weaker for token/session handling.

```text
ADDITIONAL REQUIREMENTS — AUTH / SESSION (override weaker rules):

Session & token handling (authoritative — match the scheme in the API contract):
- Session-cookie scheme: rely on httpOnly cookies set by the server; configure Axios
  with `withCredentials: true`. Do NOT read/store the session token in JS; never put
  it in localStorage.
- Bearer scheme: keep the access token in memory (or a NON-persisted Zustand auth
  store) and the refresh token in the most secure store available to the app.
  Never log tokens. Remember: anything bundled by Vite is public — no secrets in
  frontend code or env vars.
- CSRF: if the contract uses CSRF, read the token from the documented cookie/endpoint
  and attach it on every state-changing request via an Axios request interceptor.
  On a CSRF mismatch/error, refresh the CSRF token once and retry the request once.

401 / expiry flow (Axios response interceptor):
  1. On 401 -> attempt session/token refresh (if the contract exposes a refresh
     endpoint) -> retry the original request ONCE. Queue concurrent 401s so refresh
     fires only once.
  2. If refresh fails or there is no refresh endpoint -> perform full logout.

Logout MUST:
  - clear in-memory/auth-store tokens and any auth flags,
  - clear the feature's cached data (localStorage/IndexedDB keys, persisted stores),
  - call `queryClient.clear()` (or invalidate auth + user queries) so no stale data
    leaks,
  - sign out of any auth SDK in use if present,
  - redirect via router replace (no back-stack into authed routes).

Auto-login / boot:
  - Validate the stored session/token before treating the user as logged in (verify
    with a `/me`-style endpoint or token validity check). Never auto-login on
    unvalidated data.
  - On a new login, clear the previous user's cached data and query cache first
    (no User A -> User B leakage).
  - Guard authed routes with a route guard / wrapper that reads the validated auth
    state.

Security:
  - No passwords/OTPs/tokens in console.log or error reporting.
  - Errors surfaced to the UI must be user-safe (no raw server/internal details).
```

---

## PROMPT B — Bug Fix (surgical, change‑nothing‑else)

> Use after the developer tests and finds a problem. Fill in BOTH error sections.

```text
You are fixing ONE specific defect in this React + TypeScript feature. Make the
SMALLEST possible change. Do not refactor, rename, reformat, restyle, "improve", or
touch anything that is not strictly required to fix this exact issue.

FEATURE: <<feature name>>

WHAT THE USER SEES IN THE UI:
<<describe the wrong behavior: screen, steps to reproduce, expected vs actual,
 screenshot notes if any>>

CONSOLE / NETWORK / BUILD OUTPUT (paste exactly):
<<full stack trace / ESLint / tsc error / failed network request + response /
 runtime exception>>

RULES:
- First, read REACT_VITEJS_CODING_STANDARDS.md and the relevant files, then state the
  ROOT CAUSE in 1–3 lines BEFORE changing code.
- Change ONLY the file(s) required for this fix. List each file and the exact lines
  changed. If a fix seems to require touching presentation layout/styling, STOP and
  explain instead — do not change JSX structure or styles.
- Do NOT alter the API contract, other features, naming, formatting of unrelated
  code, or any working behavior. Do not move server data into Zustand (or UI state
  into the query cache) to "fix" it unless that misuse IS the root cause.
- Keep it compliant: the fix must still pass `npm run lint`, `npx tsc --noEmit`, and
  `npm run build`. Do not introduce new lint/type violations.
- If you are not confident of the root cause from the info given, ask for the
  specific additional log/file you need rather than guessing.

OUTPUT:
1. Root cause (concise).
2. The minimal diff (file + lines).
3. Why this is the smallest correct fix and what you deliberately left untouched.
4. Confirmation that lint + tsc + build still pass.
```
