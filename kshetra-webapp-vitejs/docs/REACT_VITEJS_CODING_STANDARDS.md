# React + Vite — Coding Standards

Coding standards for our React + Vite enterprise stack. This document is **binding**
for all feature work. It pairs with `REACT_VITEJS_FEATURE_PROMPTS.md`, which defines
the architecture and folder structure these rules protect.

> **Stack:** React + Vite · TypeScript (strict) · TanStack Query (server state) ·
> Zustand (client state) · Axios · Zod · React Router · ESLint + Prettier

---

## 1. The golden rule — dependencies point inward

```
presentation  →  application  →  domain
infrastructure  →  domain
```

- `domain` imports **nothing** from the other layers. Pure TypeScript only.
- `presentation` never imports Axios, storage, or data-sources directly — it talks
  only to `application` hooks.
- `infrastructure` implements domain interfaces; it never imports React or JSX.
- Breaking this rule is a review failure, even if the code "works".

**In simple English:** the UI should never know *how* data is fetched, and the data
layer should never know *how* it is displayed. That separation is what lets us swap
Axios, the cache, or even the design system without rewriting business logic.

---

## 2. Naming conventions

### Files & folders

| Thing | Convention | Example |
|---|---|---|
| Folders | kebab-case | `data-sources/`, `order-history/` |
| React components | PascalCase `.tsx` | `OrderCard.tsx`, `LoginScreen.tsx` |
| Hooks | camelCase, `use` prefix | `useOrdersQuery.ts`, `useDebounce.ts` |
| Usecases | camelCase verb file | `fetchOrders.ts`, `submitPayment.ts` |
| API clients | `<feature>.api.ts` | `orders.api.ts` |
| DTOs | `*.request.ts` / `*.response.ts` | `createOrder.request.ts` |
| Repository interface | `<feature>.repository.ts` | `orders.repository.ts` |
| Repository impl | `<feature>.repository.impl.ts` | `orders.repository.impl.ts` |
| Zustand store | `<feature>.store.ts` | `cart.store.ts` |
| Query keys | `<feature>.keys.ts` | `orders.keys.ts` |
| Local data source | `<feature>.local.ts` | `orders.local.ts` |
| Entities/types | camelCase file, PascalCase type | `order.ts` → `interface Order` |

### Code symbols

| Thing | Convention | Example |
|---|---|---|
| Components / types / interfaces / enums | PascalCase | `OrderCard`, `OrderRepository` |
| Functions / variables | camelCase | `fetchOrders`, `selectedId` |
| Hooks | `use` + PascalCase | `useOrdersQuery`, `useAuthStore` |
| Query hooks | end with `Query` / `Mutation` | `useOrdersQuery`, `useCreateOrderMutation` |
| Constants | UPPER_SNAKE_CASE | `API_TIMEOUT_MS`, `STORAGE_KEY_CART` |
| Boolean names | `is/has/can/should` prefix | `isLoading`, `hasError`, `canSubmit` |
| Event handlers | `handle` prefix (definition), `on` prefix (prop) | `handleSubmit`, `onSubmit` |

### Rules
- **One component per file**; the file name equals the component name.
- **One usecase per file**; the file verb equals the function verb
  (`fetchOrders.ts` exports `fetchOrders`). Same rule as Flutter's UseCaseNamingRule.
- **No magic numbers or strings.** Every literal that has meaning gets a named
  constant in `core/config/` (global) or at the top of the file (local).

---

## 3. TypeScript rules

- **Strict mode is on and stays on** (`"strict": true` in tsconfig). Never weaken it.
- **No `any`.** Use `unknown` + narrowing if the type is genuinely unknown.
- **No non-null assertions (`!`)** unless provably safe — prefer `??`, `?.`, and
  explicit guards.
- **Entities are immutable:** all fields `readonly`; no methods, no React, no Axios.
- **Model states as discriminated unions** when a value has distinct shapes:

  ```ts
  type SubmitState =
    | { status: 'idle' }
    | { status: 'submitting' }
    | { status: 'error'; message: string }
    | { status: 'success'; orderId: string };
  ```

- **Use path-alias imports** (`@/features/orders/...`), never deep relative chains
  (`../../../core/...`). Aliases are defined in `vite.config.ts` + `tsconfig.json`.
- **`interface` for object shapes, `type` for unions/intersections** — be consistent.
- Prefer `const` everywhere; `let` only when reassignment is required; never `var`.

---

## 4. State management rules

### The split (most important rule in this document)

| Kind of state | Lives in | Never in |
|---|---|---|
| Server data (anything fetched from an API) | **TanStack Query cache** | Zustand, useState |
| Client/UI state (filters, modals, wizard steps, selections) | **Zustand** (shared) or `useState` (local) | Query cache |

**In simple English:** if the server is the source of truth for a piece of data, the
query cache owns it. Copying server data into a store creates two sources of truth
that drift apart — that's where stale-data bugs come from.

### TanStack Query

- Query keys come **only** from the centralized key factory (`<feature>.keys.ts`):

  ```ts
  export const ordersKeys = {
    all: ['orders'] as const,
    lists: () => [...ordersKeys.all, 'list'] as const,
    list: (filters: OrderFilters) => [...ordersKeys.lists(), filters] as const,
    detail: (id: string) => [...ordersKeys.all, 'detail', id] as const,
  };
  ```

  No inline `['orders', id]` arrays scattered around components.
- Query/mutation hooks call **usecases**, never repositories or Axios directly.
- **Every mutation invalidates** the query keys it affects (`queryClient.invalidateQueries`).
- Set a sensible `staleTime` per query — don't leave everything at `0` (refetch storm)
  or `Infinity` (stale forever) without a reason.
- Handle **all four states** in the UI: `isLoading`, `isError`, empty data, and success.
  Empty is a state, not an accident.
- No fetching inside render bodies or `useEffect` — fetching happens **only** through
  query hooks.

### Zustand

- One store per feature (`<feature>.store.ts`), holding **client state only**.
- State changes go through **actions defined in the store** — components never call
  `setState` on a store from outside.
- **Read with selectors** to avoid unnecessary re-renders:

  ```ts
  const filter = useOrdersStore((s) => s.filter);     // ✅ selector
  const store = useOrdersStore();                      // ❌ subscribes to everything
  ```

- Keep state at the lowest level that works: component `useState` first; lift to a
  Zustand store only when more than one screen/component needs it.
- Persist a store (localStorage middleware) only with an explicit reason, and never
  persist tokens or server data.

---

## 5. Layer rules (per the architecture doc)

### domain/ — DECLARE
- Entities: plain `readonly` types. Repository contracts: TS interfaces with method
  signatures only, returning `Promise<Result<T>>` (the project's Result/Failure type
  from `core/error`).
- Zero imports from React, Axios, Zod, or any other layer.

### infrastructure/ — DEFINE
- **Validate every API response with Zod at the boundary** before it enters the app:

  ```ts
  const parsed = orderResponseSchema.parse(res.data); // throws → mapped to Failure
  return toEntity(parsed);
  ```

- DTOs (`*.request.ts` / `*.response.ts`) carry a Zod schema, the inferred type, and a
  `toEntity()` mapper. **DTOs never leak above this layer** — everything upward sees
  domain entities only.
- `RepositoryImpl` joins remote + local, validates before caching, and maps every
  error to a typed `Failure` via `core/error`. It never throws raw Axios errors upward.
- Local caching (`*.local.ts`) only when the feature genuinely needs it; storage keys
  via constants from `core/storage` — never magic strings.

### application/ — CALL
- Usecases are **thin**: call the repository, return the result. No React, no JSX,
  no direct Axios. One action per file.
- Query hooks and store slices live here — they are the only things presentation
  may import for data.

### presentation/ — DISPLAY
- Components and screens contain **UI logic only**: no business rules, no fetching,
  no direct storage access.
- Loading/error/empty UI uses the shared components from `shared/ui` — don't invent
  per-screen spinners.
- Keep components small; if a component handles data wiring **and** complex layout,
  split it (container + presentational).

---

## 6. Error handling

- Errors are **values, not surprises**: infrastructure converts every failure into a
  typed `Failure` (network, validation, unauthorized, server, unknown) from `core/error`.
- The UI shows **user-safe messages** — never raw server errors, stack traces, or
  Axios internals.
- No silent `catch {}` blocks. Either handle the error meaningfully or let it reach
  the layer that can.
- No `console.log` in committed code. Use the project logger (if present) for
  diagnostics; **never log tokens, passwords, OTPs, or personal data.**
- Wrap route trees in an error boundary so one crashed screen doesn't kill the app.

---

## 7. Component & hook rules

- **Function components + hooks only.** No class components.
- **Obey the Rules of Hooks** (top level only, no conditionals/loops) — the ESLint
  plugin enforces this; never suppress it.
- Exhaustive `useEffect` dependency arrays. If the lint rule complains, fix the code,
  don't silence the rule. Prefer no `useEffect` at all — most "sync" effects are
  better expressed as query hooks, derived values, or event handlers.
- Derive, don't duplicate: if a value can be computed from props/state/query data,
  compute it in render (memoize only when measured as expensive) instead of mirroring
  it into another `useState`.
- Provide stable, meaningful `key`s in lists (ids, not array indexes).
- Props: destructure at the top; type with an `interface`/`type` named `<Component>Props`.

---

## 8. Imports, formatting & lint gate

- **Prettier formats, humans don't argue.** Run it on save / pre-commit.
- ESLint config is binding: React hooks rules, TypeScript rules, import-order rule.
- Import order (enforced): 1) node/react, 2) external packages, 3) `@/core` + `@/shared`,
  4) `@/features/...`, 5) relative siblings — separated by blank lines.
- **Zero-warning policy:** code merges only when all of these pass:

  ```bash
  npm run lint          # ESLint  → 0 errors, 0 warnings
  npx tsc --noEmit      # types   → 0 errors
  npm test              # tests   → passing (when present)
  npm run build         # vite build succeeds
  ```

---

## 9. Environment & configuration

- All environment values go through Vite env vars (`import.meta.env.VITE_*`),
  read **once** in `core/config/` and exported as typed constants. No `import.meta.env`
  sprinkled through feature code.
- `.env` files are never committed (only `.env.example` with placeholder values).
- **Secrets never live in frontend code or env vars** — anything in a Vite bundle is
  public. Auth follows the session/token rules in `REACT_VITEJS_FEATURE_PROMPTS.md`.

---

## 10. Dependency policy

- Use **only** the versions pinned in `package.json`. Upgrades are deliberate,
  reviewed changes — not side effects of a feature PR.
- Adding a new dependency requires justification in the PR description (what it does,
  why existing stack can't, bundle-size impact).
- Standard stack (installed by `scaffold-structure.sh`):
  `@tanstack/react-query`, `zustand`, `axios`, `zod`, `react-router-dom`.

---

## 11. Quick self-review checklist (before every PR)

- [ ] Dependencies point inward — no layer-rule violations.
- [ ] No server data stored in Zustand or `useState`; no UI flags in the query cache.
- [ ] Query keys come from the `<feature>.keys.ts` factory; mutations invalidate them.
- [ ] All responses Zod-validated at the infrastructure boundary; DTOs mapped to entities.
- [ ] Loading / error / empty / success all handled in the UI.
- [ ] No `any`, no unsafe `!`, no magic numbers/strings, no `console.log`.
- [ ] Naming matches Section 2 (files, hooks, stores, usecases).
- [ ] `lint` + `tsc --noEmit` + `build` all pass with zero errors/warnings.
- [ ] New shared code placed in `core/`/`shared/` correctly and reported in the PR.

---

**The whole document is three habits:**
1. **Keep the layers honest** — UI displays, application calls, infrastructure fetches,
   domain declares.
2. **Let each tool do its one job** — Query owns server data, Zustand owns UI state,
   Zod guards the boundary.
3. **Leave nothing implicit** — no magic values, no `any`, no silent errors, no
   unhandled states.
