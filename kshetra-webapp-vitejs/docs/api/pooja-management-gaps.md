# Pooja Management — Gaps Between Backend and UI

Everything the pooja catalogue backend supports that the console does not expose, and everything the console draws that no backend supports.

Both screens — **Poojas** (`/poojas`) and **Gods** (`/gods`) — were the original prototype: server data held in `useState` seeded from `presentation/data/*.mock.ts`, with search, filtering, sorting, paging and the KPI tiles all computed in the browser. They are now wired to the API; the mocks are gone.

Contract references: [pooja_management_god.md](pooja_management_god.md) and [pooja_management_poojas.md](pooja_management_poojas.md). This file is the audit taken against those two documents; it is the record of what the integration deliberately leaves out and why.

Status legend: ✅ built · 🟡 partial · ❌ nothing.

**Data column** = client repository, schema and query/mutation hook exist. **UI column** = a control a user can actually reach.

The integration pass has landed. The tables below record where it left things.

---

## A. Endpoints with no UI

### Gods — `/api/booking/poojacategory/` (god doc §2)

| Endpoint | Permission | Data | UI | Notes |
|---|---|---|---|---|
| `GET poojacategory/` | `view_poojacategory` | ✅ | ✅ | Fetched **unpaged** on purpose (§7 makes paging opt-in) so reorder always holds the complete order; the screen pages what it has. `search` and `is_active` still go server-side |
| `GET poojacategory/<id>/` | `view_poojacategory` | ✅ | ✅ | The drawer reads the row out of the list cache; there is one list and it carries every field |
| `POST poojacategory/` | `add_poojacategory` | ✅ | ✅ | *Add god*. The `{message, data}` wrapper (§10) and a bare object both parse |
| `PUT`/`PATCH poojacategory/<id>/` | `change_poojacategory` | ✅ | ✅ | Edit + the row Status switch, which PATCHes `is_active` alone |
| `DELETE poojacategory/<id>/` | `delete_poojacategory` | ✅ | ✅ | The delete card now reads the real `poojas_count`, so the button and the server's refusal cannot disagree |
| `POST poojacategory/reorder/` | `change_poojacategory` | ✅ | ✅ | Drag-to-reorder, optimistic with rollback. **Disabled while a filter is active** — see below |
| `POST poojacategory/bulk-status/` | `change_poojacategory` | ❌ | ❌ | No checkbox column on this table — §17 says so deliberately, the first column is drag handles |
| `POST poojacategory/bulk-delete/` | `delete_poojacategory` | ❌ | ❌ | As above |

**6 of 8 wired end to end.**

On reorder: §8 requires *every* god id exactly once, so a filtered list is not a valid order. Rather than silently sending a subset — which would drop every god the filter hid — dragging is refused while a search or status filter is on, and the screen says so. The client computes no `sort_order`; the server numbers `1..N` and its answer replaces the optimistic guess.

The two bulk endpoints have no control on this screen by design. They stay `❌` and that is not a defect.

### Poojas — `/api/booking/poojas/` (poojas doc §1)

| Endpoint | Permission | Data | UI | Notes |
|---|---|---|---|---|
| `GET poojas/` | `view_pooja` | ✅ | ✅ | Server-side search, five filters, five sortable headers, paging and the `summary` tiles |
| `GET poojas/<id>/` | `view_pooja` | ✅ | 🟡 | Hook exists (`usePoojaQuery`); the drawer reads the list row, which already carries every field |
| `POST poojas/` | `add_pooja` | ✅ | ✅ | *Add pooja*, including both nested cards in the same request |
| `PUT`/`PATCH poojas/<id>/` | `change_pooja` | ✅ | ✅ | Edit + the row Status switch, which PATCHes `status` alone |
| `DELETE poojas/<id>/` | `delete_pooja` | ✅ | ✅ | Drawer delete and the row menu. The §15 guard surfaces as the server's own message |
| `POST poojas/<id>/duplicate/` | **`add_pooja`** | ✅ | ✅ | Row kebab → *Duplicate*. Needs `add_pooja`, not `change_pooja` |
| `POST poojas/bulk-status/` | `change_pooja` | ✅ | ✅ | Selection bar |
| `POST poojas/bulk-delete/` | `delete_pooja` | ✅ | ✅ | Selection bar. `skipped` is surfaced verbatim — a booked pooja is named, not silently dropped |
| `GET poojas/<id>/unavailable-dates/` | **`change_pooja`** | ❌ | ❌ | Deliberately unused: gated at write level, so calling it would 403 on a viewer's own screen. Blocks render from the pooja payload, which every read already carries — see §D4 |
| `POST poojas/<id>/unavailable-dates/` | `change_pooja` | ✅ | 🟡 | Repository method exists. The form saves blocks through the pooja's own `unavailable_dates`, which reconciles the whole card in one transaction |
| `DELETE .../unavailable-dates/<block_id>/` | `change_pooja` | ✅ | 🟡 | As above — removing a row from the card lifts the block on save |
| `GET poojas/<id>/availability/` | `view_pooja` | ✅ | ✅ | The drawer's booking-calendar panel. Replaced the browser-side `resolveBookable()` |
| `GET poojas/import/template/` | `view_pooja` | ✅ | ✅ | *Download template* and *Load sample data*, one endpoint so they cannot drift |
| `POST poojas/import/` | `add_pooja` | ✅ | ✅ | Real upload; the modal renders the server's per-row `created`/`errors` |
| `GET poojas/weekly_pooja/` | `view_pooja` | ❌ | ❌ | App home screen feed; no back-office use |

**13 of 15 wired; the two blocks sub-resource reads are intentionally unused.**

Still with no UI: `/api/booking/special-pooja-dates/` (its `DELETE` is the only thing that retracts a published date and unwinds the orders against it) and `/api/booking/special-pooja-date-repeats/` — see §B1.

---

## B. UI the API does not support

These are the forced product decisions. Each is a control that exists on screen today and cannot be made to work against the documented contract.

### B1. Recurrence — the ScheduleBuilder was far wider than the backend ⚠️ deferred

The removed `ScheduleBuilder.tsx` and `scheduleLogic.ts` implemented a full recurrence engine:

| Frequency | Backend support |
|---|---|
| `weekly` on chosen weekdays | ✅ the only supported shape |
| `daily` | ❌ |
| `monthly` by day-of-month (`monthlyDom`) | ❌ |
| `monthly` by nth weekday (`monthlyOrdinal` + `monthlyWeekday`) | ❌ |
| `yearly` | ❌ |
| `custom` every N weeks / N months (`customInterval`, `customUnit`) | ❌ |

| End mode | Backend support |
|---|---|
| `on` a date | ✅ — `end_date` |
| `never` | ❌ — `end_date` is part of the rule; a rule is always bounded |
| `after N occurrences` (`endCount`) | ❌ |

Poojas doc §14 gives `special-pooja-date-repeats/` exactly three inputs: `start_date`, `end_date`, `weekdays_list` (`0 = Monday`). Everything else in `recurringOccurrences()` and `monthlyDateFor()` — roughly 90 lines of date maths — has **no persistence path**. A user can build a "monthly on the second Tuesday" rule today, see a correct preview, save, and lose it.

**What the integration did: removed the builder rather than half-wire it.** `ScheduleBuilder.tsx` and `scheduleLogic.ts` are deleted. The Schedule tab now edits the two things the contract fully specifies — published dates (`special_pooja_dates`, saved with the pooja) and blocks — and the drawer shows the server's own calendar from `availability/`.

Trimming to weekly-by-weekday was the intended outcome and remains the right one, but it is **deferred, not done**, for a reason worth recording: §14 names `/special-pooja-date-repeats/` and its three fields, and stops there. It does not document how to list the rules belonging to one pooja, what the create and update payloads return, or when `generate_dates/` must be called rather than relied on. Building a rule editor against that would mean guessing three request shapes, and a guessed shape that half-works is worse than an absent tab.

**To finish this, the contract needs:** the list/filter parameters for `special-pooja-date-repeats/` (a `?pooja=<id>` filter, presumably), the response envelope for create and update, and whether a rule regenerates its dates on save or only on `generate_dates/`. With those three answers the tab is roughly a day's work — the repeats resource is small.

Also worth stating: rules and dates are **regenerated server-side**. Creating or updating a rule regenerates its future dates and `POST .../<id>/generate_dates/` re-syncs on demand, and both honour blocks. The client should never compute the dates a rule expands to and post them as individual dates — that reimplements the server and drifts from it. That is exactly why the deleted `recurringOccurrences()` was not kept as a client-side stand-in.

### B2. Per-date poojari incentive — a field that could never save ✅ removed

`SpecificDatesEditor.tsx` used to render an *Incentive ₹* input on every specific date, carried through `poojaForm.ts` and validated on save.

The special-pooja-date field list (poojas doc §17) is `id, pooja, pooja_name, date, malayalam_date, time, online_price, offline_price, status, banner, rule_id, linked_orders_count, created_at, modified_at`. **There is no incentive field.**

Per §10, `poojari_incentive` is a property of the *pooja*, snapshotted onto each order line when a booking is taken. It cannot vary by date. The input is gone; leaving it would have been worse than never having it, because it looked like it saved.

### B3. Two fields the form did not collect ✅ added

The mirror image of B2 — real columns with no input. Both now have one:

- **`time`** on a special pooja date (§14: "one published date, with its own optional `time`"). Added beside the two price overrides. `banner` got a toggle in the same row.
- **`reason`** on a block (§11). Added to the *Block* row and shown on each block chip.

Still unshown on a block: `days`, `created_by_name` and `created_at`, so there is no way to see *who* blocked a date or *when* — only why.

### B4. The bookable-date preview was computed client-side ✅ replaced

`resolveBookable()` unioned the recurring occurrences with the specific dates, subtracted the blocked ranges, and rendered the next N bookable days. The server owns that answer at `GET <id>/availability/` (§12), which returns `blocked_dates` (expanded), `blocks` (unexpanded) and `bookable_dates`. The drawer now reads it.

Two reasons the client version was wrong rather than merely redundant: it could not know about a block another admin added since the page loaded, and §12 notes `bookable_dates` is **`null` for a regular pooja** — a distinction ("bookable any day the temple has not blocked" vs "this finite list") that the client version collapsed. The panel now renders those as two different sentences.

### B5. CSV import validated against mock data ✅ replaced

`importCsv.ts` parsed the file in the browser and validated each row against the **mock god list**, rejecting unknown or inactive gods. It is deleted; the file now goes to `POST import/`. The server is authoritative (§13) and applies rules the browser cannot: a pooja name that already exists *under the same primary god* fails, prices accept `2,100` and `₹2100`, header matching ignores case/underscores/BOM, and limits are 1000 rows / 2 MB.

The modal keeps its two stages, but the second is now a **display of the server's answer**: `errors[]` carries `row` / `column` / `value` / `error` per row, where `row` is the spreadsheet line number with the header as row 1, and the good rows import regardless.

### B6. Client-side name-clash validation ✅ removed

`validatePoojaForm` walked the whole in-memory catalogue looking for a pooja with the same name under an overlapping god. Once the list is server-paged that check sees at most one page and is quietly wrong. It is gone; the server's 400 is surfaced per-field instead.

---

## C. API fields nothing renders

| Field | Where | Note |
|---|---|---|
| ~~`captions_desc`~~ | Pooja | ✅ Now has an input on the special-pooja Media tab |
| `parent`, `children` | God | The Gods screen has no hierarchy and always sends `parent: null`. The field is live though — a god with children cannot be deleted (§13). §17 also flags `children` as serialised recursively on every row, a query per row, for a screen with no hierarchy |
| `media_public_id`, `home_media_public_id`, `banner_public_id` | God, Pooja | Storage handles, read-only. Nothing needs them |
| ~~`poojas_count`~~ | God | ✅ Now read from the API. §5: a union over primary and secondary gods, counted once, and deliberately the same figure the delete guard uses — so the column and the refusal cannot disagree. The cell links to `/poojas?god=<id>` |
| ~~`next_sort_order`~~ | Both summaries | ✅ Now pre-fills *Display order*, replacing a local `max(sortOrder) + 1`. §7/§6: the one summary figure **not** filtered, precisely so a new record lands at the end of the catalogue rather than the end of a search result |
| `malayalam_date`, `linked_orders_count`, `rule_id` | Special pooja date | No UI |
| `days`, `created_by`, `created_by_name`, `created_at` | Block | Still no UI. `reason` now has one — see B3 |
| `published_special_dates_inside`, `confirmed_bookings_inside` | Block POST response | §11: blocking *reports* what it lands on so nobody blocks a day blind. The UI discards it. **This is a real safety affordance being dropped** |
| ~~`banner`~~ | Special pooja date | ✅ Toggle added beside the date's price overrides |
| `god_names[1..]` | Pooja | The list still shows all names joined, but the **primary** god is only distinguishable in the drawer, which names it under the picker. In the table a multi-god pooja does not say which of its gods is primary |

---

## D. Permission changes required

**Documented, deliberately not implemented.** Recorded here as a change-set to be applied on a separate pass.

### D1. Both routes mount ungated

`src/app/layout/nav.ts:59-65` — the `pooja-mgmt` group and both its children carry `roles` (display vocabulary) but **no `permissions` array**:

```ts
{ id: 'poojas', label: 'Poojas', path: '/poojas', roles: ['Admin', 'Manager'] },
{ id: 'gods',   label: 'Gods',   path: '/gods',   roles: ['Admin', 'Manager'] },
```

`routes.tsx` derives every route's gate from NAV via `permissionsForPath()`, so an absent `permissions` key means `<ProtectedRoute requires={[]}>` — any signed-in console user reaches both screens. Required:

| Path | Gate |
|---|---|
| `/poojas` | `booking.view_pooja` |
| `/gods` | `booking.view_poojacategory` |

These are **distinct permissions** (god doc §3 vs poojas doc §2) and a role can hold one without the other.

### D2. Eight codenames missing from `PERMISSIONS`

`src/features/auth/application/hooks/permissions.ts` carries only `addPoojaOrder: 'booking.add_poojaorder'` from the `booking` app. Gating the write controls needs:

```ts
viewPooja:            'booking.view_pooja',
addPooja:             'booking.add_pooja',
changePooja:          'booking.change_pooja',
deletePooja:          'booking.delete_pooja',
viewPoojaCategory:    'booking.view_poojacategory',
addPoojaCategory:     'booking.add_poojacategory',
changePoojaCategory:  'booking.change_poojacategory',
deletePoojaCategory:  'booking.delete_poojacategory',
```

Then `useCan()` gates *Add pooja* / *Add god*, the row Status switches, the drawers' Save and Delete, drag-to-reorder, the bulk bar, Duplicate and Import — the same three patterns the store screens use (hide the button, disable the control, gate the query).

### D3. The role builder cannot grant Gods access at all

`MODULE_MAP`'s `pooja_catalogue` block (`src/features/rbac/domain/entities/module-map.ts:109-120`) lists only the pooja codenames:

```ts
{ key: 'read',   permissions: ['booking.view_pooja'] },
{ key: 'create', permissions: ['booking.add_pooja'] },
{ key: 'update', permissions: ['booking.change_pooja'] },
{ key: 'delete', permissions: ['booking.delete_pooja'] },
```

Gods are a separate model with separate codenames, so **no combination of ticks in the role builder grants god management**. Either extend each capability's AND-set to include the `poojacategory` codename, or add a `gods` module of its own. The latter is truer to the permission model — the backend genuinely allows editing poojas without editing gods — but it adds a module to a grid the contract doc enumerates, so it is a decision, not a fix.

### D4. `unavailable-dates` GET is gated at write level

Poojas doc §2: `unavailable_dates` covers both the `GET` and the `POST` on that path, so **listing blocks requires `change_pooja`**. A read-only client that only needs to know which days are unavailable must call `availability/`, which needs `view_pooja`.

Practical consequence: the drawer must not call `unavailable-dates/` to populate a read-only view, or a viewer-role operator gets a 403 on their own screen. Use the `unavailable_dates` already nested in the pooja payload for display, and reserve the sub-resource for writes.

---

## E. Contract ambiguities, and how the client absorbed them

Three things the two documents leave unstated. None is guessed at; each is handled so that either answer works.

- **Response envelope asymmetry.** God create/update wrap the object as `{message, data}` (god doc §10); the poojas doc shows no wrapper on §8's create. Both `godWriteResponseSchema` and `poojaWriteResponseSchema` are a Zod union accepting **either** shape, so the asymmetry cannot bite whichever way it resolves.
- **Which derived fields come back on a write.** The read side gives `gods`, `god_ids`, `god_names` and `category_name` (§9), and `poojas_count` on a god (§5). Whether all of them are on a `POST`/`PATCH` response is unstated. So writes **invalidate the detail key rather than seeding the cache from the response** — a partial response cannot poison the cache — and `toPooja` falls back to the nested `gods` array when `god_ids` is absent. Once confirmed present, the invalidation can be tightened to a `setQueryData` and one request per save disappears.
- **`special_pooja_dates: []`.** §8 says the field is additive and never deletes; whether an explicit empty list is a no-op or an error is unstated. The client omits the key entirely when there is nothing to add, so it never finds out.

A fourth, worth a live check rather than a code change: §8 says a block already present **keeps its id, author and timestamp** across a re-save. The client sends blocks by range without ids, so this depends on the server matching them by range. If it does not, re-saving an untouched form would rewrite every block's history.

---

## F. Two known limitations, accepted rather than fixed

Both are real, both are recorded here instead of being papered over.

**A save lifts expired blocks.** `unavailable_dates` on the pooja payload carries only blocks that have **not yet passed** (§3), and the form sends the card back as the complete list for the server to reconcile against. An expired block is therefore absent from what is sent, and reconciling lifts it. Nothing bookable changes — those days are in the past — but the record of who blocked them, and why, is lost.

Fixing it needs the blocks read with `?include_past=true`, which lives on `GET <id>/unavailable-dates/` and is gated at `change_pooja` (§D4). That is acceptable inside an edit form, which already requires `change_pooja`, so the fix is: fetch the full block list when the drawer enters edit mode, seed the card from that, and send the union back. It was left out because it adds a request to every edit for a benefit that is purely archival.

**A published date cannot be withdrawn from the form.** `special_pooja_dates` is additive and never deletes (§8), so a remove button on an already-published date would do nothing. Rather than ship a control that silently fails, published rows show a lock; only rows added in the current session can be taken back out. Withdrawing a published date needs `DELETE /booking/special-pooja-dates/<id>/`, which unwinds the orders against it properly — a different operation with different consequences, and one that deserves its own confirmation rather than a quiet × on a chip. The endpoint constant exists (`POOJA_ADMIN_ENDPOINTS.specialPoojaDate`); the UI does not.

---

## G. A stale claim in a sibling document

[counter-bookings-gaps.md](counter-bookings-gaps.md) §H states:

> **`booking/poojas/` and `booking/poojacategory/` ignore `page`/`page_size`** and return `{count, results}` with no `next`/`previous`. They are not DRF pages — `wire.ts` models them separately as `countedList`.

`src/core/api/wire.ts` carries the same warning in the doc comment on `countedList`.

The two pooja-management contracts supersede this: paging is **opt-in** (god doc §7, poojas doc §5). Send neither parameter and the response is the whole list with `{count, results}` — which is what the earlier observation saw and why the counter's unpaged fetch still works. Send `page` or `page_size` and it is a page with `next`/`previous`, `page_size` defaulting to 20 and capped at 100.

Both envelopes are therefore live, and `countedList` remains correct **for the counter's unpaged call specifically**. The Poojas back-office list opts into paging and needs the paged schema. Neither the comment nor the counter's call needs changing; this note exists so the contradiction is not rediscovered as a bug.

---

## H. What the integration deleted, and what it left alone

**Deleted:** `presentation/data/gods.mock.ts`, `poojas.mock.ts`, `importSample.mock.ts`, `lib/importCsv.ts`, `lib/scheduleLogic.ts`, `components/ScheduleBuilder.tsx`, `components/PastSpecificDatesModal.tsx`, and the derived `POOJA_COUNT_BY_GOD`.

`PastSpecificDatesModal` went because the list returns **upcoming, active, unblocked** dates only (§3). There is no past-dates history to show, and a modal that could only ever be empty is worse than no modal. Recovering it needs `/special-pooja-dates/?pooja=<id>` with a date filter — another under-documented corner of that resource.

**Left in place:** `features/users-roles/presentation/data/gods.mock.ts` — a separate, narrower `{id, name}` copy belonging to a different feature. Out of scope here; track it with that screen's own integration.

`features/counter-pos` already reads both catalogue endpoints through its own read-only slice (`catalogue.api.ts`, with `God`/`Pooja` entities carrying only what the till needs). That slice is deliberately **not** merged with this one — the shapes genuinely differ, and the `shared/order-feed` precedent applies when two screens need the *same* shape, which these do not.

What it did need was cache invalidation. `counterKeys.poojas()` and `counterKeys.gods()` hold a 5-minute `staleTime`, so a price edited in the back office would otherwise not reach the till for five minutes. Every pooja and god write now invalidates `QUERY_ROOTS.counter`, and `counter-pos.keys.ts` reads its root from `QUERY_ROOTS` so the two cannot drift apart.

---

## I. Shared code this pass added or moved

Reported here because it is outside the feature and the next module inherits it.

| Change | Why |
|---|---|
| **New** `shared/hooks/useDebounce.ts` | Seven list screens each held an identical 4-line `useEffect` + `setTimeout(300)`. This module would have been the eighth. The existing seven are untouched and can adopt it whenever they are next opened |
| **New** `shared/hooks/useObjectUrl.ts` | Four image slots across two drawers need a revoke-on-replace preview. An object URL is a live handle, not a string |
| **Moved** `FilteredEmpty`, `ListPagination` → `shared/ui/` | Both were store-local, both are store-agnostic, and features must not import each other. Only import lines changed in the store screens |
| **Extended** `shared/ui/Table.tsx` | `rowProps` — an optional per-row attribute bag, so the Gods table could take native drag handlers without being rebuilt as divs. `rows` also relaxed to `readonly T[]`, which every query result is |
| **Added** `QUERY_ROOTS.poojas`, `.gods`, `.counter` | Cross-feature invalidation without cross-feature imports |
| **Added** `POOJA_ADMIN_ENDPOINTS` | The back office's write side of the two resources `CATALOGUE_ENDPOINTS` already read |

Still duplicated, and still worth extracting when something forces the issue: **eleven per-feature `*Toast.tsx` components** and their identical `{show, message}` + `useRef` timer state. This module kept using the existing `PoojaToast` rather than becoming the twelfth *different* one.
