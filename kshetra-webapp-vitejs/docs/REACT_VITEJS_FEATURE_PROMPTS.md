# React + Vite — Enterprise Architecture Standard

A feature-first Clean Architecture standard for React + Vite, mirroring our Flutter
Clean Architecture, with the recommended state-management stack.

---

## 1. State management — the recommendation

Our Flutter stack uses **Riverpod**, which does two jobs at once: it manages *async
server data* (loading/success/error) **and** *local UI state*. In React, the enterprise
pattern is to **split those two jobs across two specialized tools**. This is the single
most important mental shift.

| Concern | Flutter (Riverpod does both) | React enterprise equivalent |
|---|---|---|
| **Server state** (API data, caching, refetch, loading/error) | Riverpod `FutureProvider` / `StateNotifier` | **TanStack Query** (React Query) |
| **Client state** (UI toggles, wizard steps, filters, auth session) | Riverpod `StateNotifierProvider` | **Zustand** |

**Chosen stack: TanStack Query + Zustand.**

**Why this combo over Redux:**
- **TanStack Query** gives caching, background refetch, retries, stale-time, request
  dedup, and `isLoading / isError / data` states *for free* — exactly the "model
  loading/success/error/empty explicitly" rule from our Flutter `states/`. Hand-writing
  that in Redux is a lot of boilerplate.
- **Zustand** is tiny, has almost no boilerplate, and feels closest to a Riverpod
  `StateNotifier` — a small store with state + actions, no provider-wrapping ceremony.
- Together they cover ~95% of an enterprise app cleanly.

**Alternatives (for context):**
- **Redux Toolkit + RTK Query** — choose only if the team wants a *single unified
  store*, heavy DevTools/time-travel debugging, or already has deep Redux expertise.
  More ceremony for the same outcome.
- **TanStack Query + Redux Toolkit** — hybrid; use when client state is genuinely large
  and interconnected.

---

## 2. Folder structure (feature-first, same 4 layers as Flutter)

```
src/
├── app/                         # App composition root (wiring only)
│   ├── providers/               # <QueryClientProvider>, router provider, theme
│   ├── router/                  # route definitions (React Router / TanStack Router)
│   └── App.tsx
│
├── core/                        # Cross-cutting concerns (our Flutter core/)
│   ├── api/                     # Axios instance, interceptors, base config
│   ├── error/                   # Failure types, Result<T>, error mapping
│   ├── config/                  # env, constants (NO magic strings)
│   └── storage/                 # localStorage / IndexedDB wrappers + key constants
│
├── shared/                      # Reusable across features
│   ├── ui/                      # design-system components (Button, Modal, Input)
│   ├── hooks/                   # generic hooks (useDebounce, useMediaQuery)
│   └── lib/                     # pure helpers/utils
│
└── features/
    └── <feature>/               # e.g. auth, orders, profile
        │
        ├── domain/              # ── A) DECLARE ──
        │   ├── entities/        # plain TS types/interfaces the UI needs
        │   └── repositories/    # ABSTRACT repo = a TS interface, no bodies
        │
        ├── infrastructure/      # ── B) DEFINE ──
        │   ├── data-sources/
        │   │   ├── remote/      # <feature>.api.ts (Axios), *.request.ts / *.response.ts DTOs
        │   │   └── local/       # <feature>.local.ts (cache via storage), ONLY if needed
        │   └── repositories/    # <Feature>RepositoryImpl — joins remote+local, maps errors
        │
        ├── application/         # ── C) CALL ──
        │   ├── usecases/        # one file per action: fetchOrders.ts -> fetchOrders()
        │   ├── queries/         # TanStack Query hooks: useOrdersQuery, useCreateOrderMutation
        │   └── store/           # Zustand slice: <feature>.store.ts (UI/client state)
        │
        └── presentation/        # ── D) DISPLAY ──
            ├── components/       # feature-specific UI pieces (from Figma)
            └── screens/          # the page/screen UI (or pages/)
```

---

## 3. Layer-by-layer mapping (Flutter → React)

| Flutter layer | React equivalent | What lives here |
|---|---|---|
| **domain/entities** | `domain/entities/*.ts` | Plain immutable types — `interface Order { readonly id: string; ... }`. No logic, no React. |
| **domain/repositories** (abstract) | `domain/repositories/*.ts` | A **TS interface**: `interface OrderRepository { getOrders(): Promise<Result<Order[]>> }`. Signatures only. |
| **infrastructure/data_sources/remote** | `infrastructure/data-sources/remote/*.api.ts` | Axios calls + `*.request.ts` / `*.response.ts` DTOs with `toEntity()` mappers (React's version of fromJson/toJson). |
| **infrastructure/data_sources/local** | `infrastructure/data-sources/local/*.local.ts` | localStorage/IndexedDB caching — **only if the feature needs it**. Keys via constants, never magic strings. |
| **infrastructure/repositories (Impl)** | `infrastructure/repositories/*.impl.ts` | The class/function that **implements** the domain interface, joins remote+local, maps errors → `Failure`. |
| **application/usecases** | `application/usecases/*.ts` | One action per file: `fetchOrders.ts`. Thin — just calls the repository. File name == function name. |
| **application/states** | `application/queries/` + `application/store/` | **This is where Riverpod splits in two:** TanStack Query hooks own *server* state (loading/success/error built-in); Zustand owns *client* state. |
| **application/providers** (Riverpod wiring) | `app/providers/` + the query/store hooks | TanStack's `QueryClientProvider` is global wiring; per-feature `useXQuery` hooks are the "controllers". |
| **presentation/components** | `presentation/components/` | Same — Figma components. |
| **presentation/screens** | `presentation/screens/` | Same — the screen UI. |

---

## 4. The whole thing in simple English

Think of every feature as a small assembly line with **4 stations**, exactly like our
Flutter app:

1. **domain — "DECLARE" (the promises).**
   This station only writes *promises on paper*. "An Order looks like this" (entity) and
   "someone, somewhere, will be able to fetch orders" (repository interface). No real
   code runs here. It's the contract. Nothing in this folder knows about Axios, React, or
   a database — that's intentional, so business rules never depend on tools.

2. **infrastructure — "DEFINE" (the real work).**
   This station *keeps the promises*. The `remote` part actually talks to the server with
   Axios and converts ugly JSON into clean entities. The `local` part saves a copy on the
   device for caching (only if you need offline/speed). The `repositoryImpl` is the worker
   who fulfils the contract from station 1 — it decides "do I hit the network or return
   the cached copy?" and turns any crash into a tidy `Failure` object instead of letting
   it explode.

3. **application — "CALL" (the brain).**
   This is where Riverpod's single job becomes **two helpers in React**:
   - **TanStack Query** = your "data fetcher with a memory." You ask `useOrdersQuery()`
     and it hands back `{ data, isLoading, isError }` and remembers the result so it
     doesn't re-fetch needlessly. This *is* the Flutter "loading / success / error /
     empty" state — but you get it for free instead of writing a state class.
   - **Zustand** = your "small notepad for UI stuff" — is the sidebar open? which filter
     is selected? which step of the form are we on? Things the server doesn't care about.
   - **usecases** are tiny single-purpose functions ("fetchOrders") so the UI never calls
     the repository directly — keeps everything testable and traceable.

4. **presentation — "DISPLAY" (the face).**
   Pure UI. `screens` are full pages; `components` are the Figma building blocks. They
   *only* call the hooks from station 3 — they never know an API or cache exists. So a
   screen reads almost like English: "give me the orders query, show a spinner while
   loading, show the list when ready."

**The golden rule (same as Flutter):** dependencies point **inward**. Presentation →
Application → Domain. Infrastructure also points at Domain (it implements the interface).
Domain depends on *nobody*. That's what keeps an enterprise app swappable — you can
replace Axios, swap REST for GraphQL, or change the cache, and the inner layers never
notice.
