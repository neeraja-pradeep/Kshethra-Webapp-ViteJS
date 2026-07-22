# Kshetra Admin — Presentation-Layer Implementation Guide

You are translating a **Claude Design DC prototype** (`*.dc.html`) into **pixel-perfect
React + TypeScript + Tailwind** inside a feature-first Clean Architecture repo.
**Scope: presentation layer only** (screens + components + typed static mock data +
domain entity *types*). No API calls, no TanStack Query, no Zustand yet.

---

## 1. The DC source format → React

Each `*.dc.html` has two parts:

- **`<x-dc>` template** — HTML with:
  - `{{ expr }}` interpolation → JSX expressions.
  - `<sc-for list="{{ items }}" as="row">…</sc-for>` → `items.map((row) => …)`.
  - `<sc-if value="{{ cond }}">…</sc-if>` → `{cond && (…)}`.
  - `<dc-import name="Button" …>` / `<x-import component-from-global-scope="…Button" …>`
    → a **`shared/ui` component** (`<Button …>`). Prop names are kebab in the template
    (`on-click`, `hint-size`) → camelCase in React (`onClick`); drop `hint-size`.
  - `style="…; …"` inline → **Tailwind classes** using the token vocabulary in §4.
    Convert every literal to a token class. `style-hover="…"` → a `hover:` class.
  - `<i class="ph ph-plus">` → `<Icon name="plus" size={…} />` (fill weight → `weight="fill"`).
- **`<script data-dc-script>` logic class** (`class Component extends DCLogic`):
  - `state = {…}` → `useState` (group related state sensibly).
  - `renderVals()` returns derived values → compute in the component body (derive, don't
    mirror into state).
  - methods (`onSearch`, `openEdit`, …) → handler functions.
  - `this.SEED`/`buildX()` arrays → **static mock data** in `presentation/data/*.mock.ts`.

Reproduce the **rendered output pixel-for-pixel**. Match every size, weight, color,
padding, gap, radius, and shadow via tokens. Do **not** copy the DC internal structure
where a cleaner React shape gives the identical visual result.

---

## 2. Where files go (per feature `<feature>`)

```
src/features/<feature>/
├── domain/entities/<name>.ts        # readonly TS interfaces + string-union types ONLY
├── presentation/
│   ├── data/<name>.mock.ts          # typed static fixtures (export const … : Entity[])
│   ├── components/<Component>.tsx    # feature-specific pieces
│   └── screens/<Screen>.tsx          # the page(s); export a named component
```

- **Do NOT edit** `src/app/router/routes.tsx` — the integrator wires routes. Just export
  your screen(s) from `presentation/screens` and list them in your final report.
- **Do NOT create** infrastructure/application folders or files. Types + mock + UI only.
- Feature folder names are kebab-case. One component per file; filename = component name.

---

## 3. Entities & mock data (make it API-ready)

- Entities are **plain immutable types**: every field `readonly`, no logic, no React import.
  Model status/enum fields as string unions, e.g. `export type PoojaStatus = 'Active' | 'Inactive'`.
- Mock data lives in `presentation/data/<name>.mock.ts`, typed as the entity:
  `export const POOJAS: Pooja[] = [ … ]`. Copy the seed values from the DC logic verbatim
  (names, prices, ids, statuses). Denormalize cross-feature references (store the god's
  display name on the row) so features stay decoupled.
- Screens read the mock array directly for now. Keep it in one place so swapping to a
  query hook later is a one-line import change.

---

## 4. Token vocabulary — Tailwind classes (NEVER raw hex / arbitrary px)

Colors are CSS-variable-backed Tailwind tokens. Use these class names:

**Surfaces:** `bg-card` (white), `bg-sunken` (page), `bg-sidebar`, `bg-hover`, `bg-active`,
`bg-overlay`, `bg-side-hover`, `bg-side-divider`.
**Primary (maroon):** `bg-primary` `text-primary` `border-primary`; `bg-primary-hover`
`bg-primary-active`; `text-primary-contrast`; `bg-primary-subtle` `bg-primary-subtle-hover`
`text-primary-subtle-text` `border-primary-border`. Ramp `primary-50…900`.
**Text (warm ramp):** `text-ink-strong` (headings), `text-ink` (body), `text-ink-muted`,
`text-ink-subtle`, `text-ink-disabled`, `text-ink-on-primary`, `text-ink-table` (table head).
**Hairline borders:** `border-stroke-subtle`, `border-stroke` (default), `border-stroke-strong`.
**Neutral ramp:** `gray-50…900` (e.g. `bg-gray-100`, `text-gray-700`).
**Status:** `{success|warning|danger|info}` → `text-*`, `bg-*-surface`, `border-*-border`,
`text-*-strong`, plus `bg-danger-subtle-hover`.
**Radius:** `rounded-{xs|sm|md|lg|xl|2xl|3xl|4xl|full}` = 4/5/6/8/10/12/16/20/9999px.
**Shadow:** `shadow-{xs|sm|md|lg|xl|card|card-hover|focus}`.
**Font size (already +2px bumped — matches the shell):** `text-2xs`(13) `text-xs`(14)
`text-sm`(15) `text-base`(16) `text-lg`(18) `text-xl`(20) `text-2xl`(22) `text-3xl`(26)
`text-4xl`(28) `text-5xl`(34) `text-6xl`(42) …
**Weight:** `font-{extralight|light|normal|medium|semibold|heading|bold}` (heading = 650, used
on page `<h1>`).
**Tracking:** `tracking-{title(-.02em)|tight|normal|wide|overline(.05em)|overline-lg(.07em)|header(.075em)}`.
**Leading:** `leading-{tight|snug|normal|relaxed}` = 1.3/1.4/1.48/1.6.
**Spacing:** default Tailwind scale plus quarter/odd-px tokens: `*-0.75`(3) `*-1.25`(5)
`*-1.75`(7) `*-2.25`(9) `*-2.75`(11) `*-3.25`(13) `*-3.75`(15) `*-4.5`(18) `*-5.5`(22)
`*-6.5`(26) `*-7.5`(30) `*-8.5`(34) `*-9.5`(38) `*-11.5`(46) `*-13`(52) `*-15`(60).
Default steps cover 6/10/14/28px = `1.5/2.5/3.5/7`. Prefer a token; only use an arbitrary
`[13px]` value if truly unavoidable.
**Duration:** `duration-{120|140|160|240}`; `ease-ks`. **z-index:** `z-{drawer|topbar|scrim|menu}`.

Page title pattern: `<h1 class="text-3xl font-heading tracking-title text-ink-strong leading-tight">`.
Section subtitle: `text-sm text-ink-muted`. Overline label: `text-2xs font-semibold uppercase
tracking-overline text-ink-subtle`.

---

## 5. shared/ui component API (import from `@/shared/ui`)

All accept `className`/`style` unless noted. Key props:

- **Icon** `{ name, size=20, weight='regular'|'fill', color }` — Phosphor webfont glyph.
- **Button** `{ theme='primary'|'default'|'danger', variant='solid'|'subtle'|'outline'|'ghost', size='sm'|'md'|'lg'|'xl', iconLeft, iconRight, loading, fullWidth, disabled, onClick }`.
- **IconButton** `{ theme, variant='ghost'|…, size='sm'|'md'|'lg', label }` — icon as children.
- **Badge** `{ color='gray'|'red'|'maroon'|'green'|'blue'|'amber', variant='subtle'|'solid'|'outline'|'ghost', size='sm'|'md'|'lg', dot, icon }`.
- **Tag** `{ size='sm'|'md', icon, onRemove, active, onClick }`.
- **Avatar** `{ src, name, icon, size='xs'…'3xl', circular=true, status }`. **AvatarGroup** `{ items, max=4, size }`.
- **Spinner** `{ size=20, color }`. **Divider** `{ orientation, label, labelPosition }`.
- **Input** `{ label, hint, error, size='sm'|'md'|'lg', variant='outline'|'subtle', prefix, suffix, required, containerStyle, …input }`.
- **Textarea** `{ label, hint, error, rows, variant }`. **Select** `{ label, hint, error, size, variant, options:[{value,label}], placeholder }`.
- **Checkbox** `{ checked, indeterminate, label, description, size }`. **Radio** `{ checked, label, description }`. **Switch** `{ checked, label, description, size='sm'|'md' }`.
- **Card** `{ title, subtitle, actions, footer, padding=16, interactive, overline }`.
- **Cell** `{ prefix, title, description, suffix, meta, size, interactive, selected, onClick }`.
- **Table** `{ columns, rows, onRowClick, selectedId, empty }`. Generic over `T extends {id}`.
  `columns: { key, header, width?, align?, render?(value,row), sub?(row) }[]`. Headers are
  sticky + styled automatically; pass plain strings/nodes. **Right-align numeric columns**
  (`align:'right'`).
- **Alert** `{ type='info'|'success'|'warning'|'danger'|'neutral', title, icon, actions, onClose }`.
- **Modal** `{ open, onClose, title, description, footer, size='sm'|'md'|'lg' }` — closes on
  overlay/Escape.
- **ProgressBar** `{ value, size, color, label, showValue }`.
- **Tabs** `{ items:[{id,label,icon?,badge?}], value, onChange, variant='underline'|'pill', size }`.
- **Breadcrumb** `{ items:[{label,href?,icon?}], size }`. **Tooltip** `{ content, placement }`.

Compose these; never re-style a button/card/input/table from scratch.

---

## 6. Standard list-view anatomy (match the shell exactly)

Every list module follows this vertical layout inside a full-height flex column
(`h-full flex flex-col bg-sunken overflow-hidden`):

1. **Header** `px-7 pt-6 pb-4` (28px/24px/16px): `<h1>` title + `text-sm text-ink-muted`
   subtitle on the left; primary `<Button>` action(s) on the right.
2. **Filter row** `px-7 pb-3.5 flex items-center gap-2.5 flex-wrap`: a 280px search `Input`
   (prefix magnifying-glass), then `Select size="sm"` filters; a `flex-1` spacer; a
   right-aligned `text-sm text-ink-subtle` result count (`ml-auto`).
3. **KPI band** `px-7 pb-3.5 flex gap-2.5 flex-wrap`: each KPI is
   `flex items-center gap-2.25 px-3.75 py-2.75 bg-card rounded-lg shadow-xs` with an optional
   8px status dot, a `text-2xl font-bold tabular-nums text-ink-strong` value, and a
   `text-xs text-ink-subtle` label.
4. **Table card** `flex-1 min-h-0 mx-7 bg-card rounded-2xl shadow-sm overflow-hidden`
   wrapping a scroll area (`flex-1 min-h-0 overflow-auto`) containing `<Table>`.
5. **Pagination** `px-7 pt-3.5 pb-5 flex items-center gap-3.5`: `Showing X–Y of Z`
   (`text-sm text-ink-subtle`), spacer, `Rows` + `Select size="sm"` page-size, prev/next
   icon buttons (`w-8 h-8 rounded-md shadow-xs bg-card`), page label.

Filtered **empty state** shows a message + a one-click "Clear filters" button.

---

## 7. View-mode detail pattern

Detail pages are **read-first**. In view mode: labels become `text-2xs font-semibold uppercase
tracking-overline text-ink-subtle` overline captions; **values lead** (`text-lg font-medium
text-ink-strong`); no input chevrons/borders; status shown as a static dot + label
(`● Active`), not a live switch. An **Edit** button flips to edit mode (boxed inputs, helper
text at `text-2xs`). Prices render formatted (`₹1,500`), empty numerics show an em-dash `—`.

---

## 8. Non-negotiables (review will reject otherwise)

- TypeScript strict: **no `any`** (use `unknown` + narrowing), no non-null `!`, entities `readonly`.
- **Path-alias imports** `@/…`, never `../../..`. Import order: react → external → `@/core`/`@/shared` → `@/features` → siblings, blank-line separated.
- **Tailwind only** — no inline `style={{}}` except genuinely dynamic numeric values (a computed
  width %, a data-driven pixel), no `.css` files, no raw hex, no magic `[13px]` when a token exists.
- Conditional classes via **`cn(...)`** from `@/shared/lib/cn` — never string concatenation.
- One component per file; `handle*` for internal handlers, `on*` for props.
- Provide stable list `key`s (ids, not indexes). Handle loading/empty/success states in the UI
  (loading can be a simple `Spinner` centered; data is static so success is the norm; empty +
  filtered-empty must exist).
- It must **type-check, build, and lint clean** (`npx tsc -b`, `npx vite build`, `npm run lint`).
- Sentence case everywhere; imperative-verb buttons; Indian number/₹ formatting; no emoji.
