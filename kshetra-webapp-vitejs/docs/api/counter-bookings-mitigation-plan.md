# Counter & Cart API — Client Mitigation Plan

Assessment of [counter-bookings.md](counter-bookings.md) and
[MULTI_POOJA_CART_DOCUMENTATION.md](MULTI_POOJA_CART_DOCUMENTATION.md) (v4.0)
against the wired counter client, plus the plan to close what they expose.

**Headline: nothing is broken.** Every client schema still parses live responses
from `127.0.0.1:8010`. No migration is forced, no hotfix is needed. What the new
docs expose is a set of gaps that were already latent — one of which is
quietly corrupting data today.

---

## A. Verified non-issues

Checked against the running server so nobody re-opens them.

| Concern | Finding |
|---|---|
| **v4.0 replaced `price` with `online_price` / `offline_price`** | Non-issue. `pooja.response.ts` already reads `offline_price`, which is what the counter must use — the desk is at the temple. `online_price` arrives and is stripped. |
| **v4.0 removed `additional_charges` from cart responses** | Non-issue. The string appears nowhere in the client. |
| **Special-pooja date pricing moved** | Non-issue. The nested `special_pooja_dates[].offline_price` is still read, and `priceForDate()` still prefers it over the base price. |
| **Special poojas return zero nested dates** | **Correct server behaviour, not a regression.** All 9 published dates are 2025; today is 2026-08-11, and the endpoint nests only *active, upcoming* dates. The UI already handles it — `openConfigForNew` refuses to open the dialog and toasts "*…has no published dates to book*". |
| **Nakshatram pagination** | Honoured. `?page_size=100` returns all 28; the default page returns 10. The client sends the param. |
| **New response fields** (`gods`, `god_names`, `category`, `sort_order`, `order_group_id`, `status`, `created_at`, `order_ref`) | Additive. Zod strips unknown keys, so none of them break a parse. |

### Schema validation run

All six counter schemas parsed against live payloads:

| Endpoint | Result |
|---|---|
| `GET booking/poojas/` | ✅ 10 poojas, 4 special, 0 currently-bookable special dates |
| `GET booking/poojacategory/` | ✅ 18 gods |
| `GET user/nakshatrams/` | ✅ 28 nakshatras |
| `GET counter/sales/` | ✅ |
| `GET counter/sales/collection-summary/` | ✅ |
| `GET counter/agent-bookings/` | ✅ |

---

## B. Issues, ranked

### B1 — Every walk-in sale is recorded with no payer ⚠️ *fix first*

`CounterPosScreen.tsx:354-355` hardcodes:

```ts
customerName: '',
customerPhone: '',
```

The request mapper, the entity and the receipt schema all carry these fields
properly — **only the UI never collects them.** §5 of the new doc makes the cost
explicit: receipt `search` matches *receipt number, customer name, customer
phone*. With both blank, **two of the three search keys are dead, and no sale
taken today can be found by who paid for it.**

This is not a missing feature so much as ongoing data loss — every sale rung up
before it is fixed is permanently unsearchable.

**Fix:** two optional inputs on the take-payment modal, threaded into the
existing `CreateSaleInput`. The payer need not be one of the people the pooja is
for, so they are genuinely separate fields, not a reuse of the roster.
**Effort: small. Value: high.**

### B2 — `order_group_id` on agent bookings is ignored

Zero occurrences of `order_group_id` in the client. §9 states: *"The whole order
group is settled by one receipt — the devotee pays for the booking, not for each
order row the checkout happened to split it into."* And the cart doc confirms
one checkout produces **one order per `(pooja, date)`**, all sharing a group.

If the list returns one row per *order*, a devotee who booked one pooja across
three dates appears as three payable rows. The operator collects on one; the
other two are now settled but still on screen. Re-collecting returns `400 "This
booking has already been paid at the counter"`, and in the worst reading the
operator believes money is still owed.

⚠️ **Unconfirmed — do not build on this yet.** The only agent booking in dev has
`order_group_id: null`, so I could not reproduce a grouped row. **Confirm with
real grouped data first**: if the server already collapses groups into one row,
there is nothing to do.

**If confirmed, fix:** group rows by `order_group_id`, falling back to
`order_id` when null; show one payable row per group; post `record-payment/`
once per group.

### B3 — Line-level execution state is unmodelled

`pooja_status` and per-line `poojari` appear **nowhere** in the client. The cart
doc is emphatic that this is now the core model:

> A line is one **booking** — one pooja, for one person, on one date — and it is
> the unit the temple actually performs. `status` is the **money**;
> `pooja_status` is the **work**. `poojari` is assigned per booking, not per
> order. `PoojaOrder.pooja_status` and `PoojaOrder.poojari` still exist, but
> both are now **roll-ups**.

The Bookings screen is still mock, so nothing is wrong *yet* — but it must be
built on **lines, not orders**, or it will show one poojari and one status for
an order that legitimately has several of each. `GET /api/admin/bookings/all/`
is live and returns 19 rows.

**Fix:** build the Bookings feature against lines. This is a feature, not a
repair — scope it separately.

### B4 — `cancelled_count` is parsed but never rendered

`counterReceipt.response.ts:56` maps it to `cancelledCount`; no component reads
it. §11 states `amount` is authoritative and **excludes cancelled occurrences**,
so it may be less than `base × count`. A partly-voided receipt therefore prints
a total that does not match its own arithmetic, with nothing explaining the
difference. **Effort: small** — one line on the receipt row.

### B5 — Degenerate agent-booking rows render blank

The live dev row: `pooja_summary: ""`, `pooja_count: 0`, `first_pooja_date:
null`, `amount: "1000.00"`, `status: "pending"`. It parses fine and renders as
an empty row with a price. Whether this is seed junk or a reachable state, the
list needs a fallback (`—` / "No poojas listed") rather than blank cells.

### B6 — Documentation hygiene

- MULTI_POOJA links `../docs/api/pooja-bookings.md` — **not in this repo.**
- It cites `/api/admin/bookings/` as the back-office endpoint. That bare path is
  a **404**; it is a prefix. The real routes are `/api/admin/bookings/all/`,
  `/complete/`, `/assign/`.
- [counter-bookings-quick-reference.md](counter-bookings-quick-reference.md) and
  the new [counter-bookings.md](counter-bookings.md) now describe the same API.
  Two overlapping contract docs will drift. **Retire the quick reference** or
  demote it to a link.

---

## C. Plan

### Phase 1 — Stop the data loss (small, ship on its own)

1. **B1** — payer name + phone on the take-payment modal, wired through
   `CreateSaleInput`. Both optional; trim before sending.
2. **B4** — render `cancelledCount` on receipt rows where it is non-zero, with a
   note that `amount` already excludes them.
3. **B5** — empty-state fallbacks in the counter-payments list.

Nothing here needs a backend change, and B1 should not wait for the rest.

### Phase 2 — Confirm, then handle order grouping

4. Get a real grouped agent booking into dev (a multi-date COD checkout), and
   check whether `agent-bookings/` returns one row per order or per group.
5. Only if it is per-order: implement **B2** grouping, and collect once per
   group.

### Phase 3 — Bookings on lines ✅ done

6. ✅ The Pooja Bookings screen is wired to `GET /api/admin/bookings/all/`,
   modelled on the **line** — `status` (work) and `lineStatus` (money) are
   separate fields, and `poojari` is per booking. Order-level roll-ups are never
   read.

**Everything is server-side**: debounced search, date range, god, pooja type,
poojari (including `unassigned`), channel, status, sort and paging. Nothing is
filtered in the browser, so no count can describe a page as if it were the feed.

The KPI tiles come from the endpoint's own `summary`, which counts the **whole
filtered set** — they hold still while you page, which the mock could not do.

Both actions are wired to their real endpoints and are all-or-nothing
server-side: `POST bookings/complete/` and `POST bookings/assign/`. They are
gated on separate permissions, as the backend intends — `manage_pooja_orders`
to record work as performed, **`assign_poojari`** to roster it, so a duty
manager can move work without the rest of the back office.

UX decisions worth keeping:

- **Selection is per page and says so** ("N selected on this page"). Server
  paging means a "select all" spanning pages would act on rows the operator
  never saw. Selection also clears on any page or filter change.
- **Only pending bookings are selectable** — the server refuses the rest, so
  offering them would be an error the operator could not have avoided.
- **"All dates" is the default**, matching the endpoint's own default. Inventing
  a window on first load would silently hide everything outside it.
- **`is_overdue` is surfaced** as a row badge and a drawer banner. It is new
  information the mock never had, and nothing expires on its own — the back
  office is shown the booking and decides.
- **Unassigned renders as a label, not a blank** — it is a state the temple acts
  on, and the feed filters to exactly it.
- The table **dims rather than blanks** while fetching (`keepPreviousData`), so
  typing in the search box does not strobe the list.

Verified end to end against the live server: all four read schemas parsed real
payloads, and both writes were exercised on a booking created for the purpose
through the counter flow, then voided. Error shapes were checked too — `404
{booking_ids}` and `400 {poojari}`.

⚠️ One residue: voiding cannot hard-delete, so the dev database keeps one extra
**cancelled** booking from that test (19 → 20 rows). Pending and completed
counts are back to their original 0 and 3.

### Phase 4 — Docs

7. Retire or demote the quick reference; fix the `/api/admin/bookings/` path and
   the missing `pooja-bookings.md` link.

---

## D. Still open from the earlier audit

Unchanged by these docs, tracked in
[counter-bookings-gaps.md](counter-bookings-gaps.md): no receipt list screen, no
reprint, and **`rbac.cancel_counter_sale` remains unreachable** — a mis-rung
sale can still only be voided with `curl` or Django admin. The new §8 documents
the void endpoint fully, which makes that gap more conspicuous, not less.
