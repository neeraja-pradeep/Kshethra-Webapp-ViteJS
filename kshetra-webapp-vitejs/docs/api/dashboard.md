# Dashboard API

`GET /api/admin/dashboard/data/`

Every number on the back office landing screen, in one request. Six cards —
pooja bookings, counter bookings, store orders, poojari management, devotees,
and the date they were all counted on.

The dashboard's job is to **agree with the screens it links to**. Every figure
here is counted the same way the screen behind it counts it: money runs through
the same `order_views._money_totals` the order list uses, and "today's
bookings" is the same set of rows the bookings feed shows for today. Nothing is
re-defined locally, so the two can never drift apart.

The example below is a real response captured from the running API.

---

## Contents

1. [Auth and permissions](#1-auth-and-permissions)
2. [Full response](#2-full-response)
3. [Pooja bookings](#3-pooja-bookings)
4. [Counter bookings](#4-counter-bookings)
5. [Store orders](#5-store-orders)
6. [Poojari management](#6-poojari-management)
7. [Devotees](#7-devotees)
8. [What is deliberately not here](#8-what-is-deliberately-not-here)

---

## 1. Auth and permissions

Session cookies, same as the rest of the API — see
[`API_PERMISSIONS.md`](./API_PERMISSIONS.md). Send `credentials: "include"`.

| Endpoint | Permission required |
|---|---|
| `GET /api/admin/dashboard/data/` | `rbac.view_admin_dashboard` |

One card asks for a second permission of its own: `devotees` is served only to a
caller who also holds `rbac.view_devotees`, and is `null` otherwise. Admin and
Manager hold both, so in practice only a custom role built in the role editor
ever sees the `null` — see [§7](#7-devotees).

**Only Admin and Manager hold it.** App Manager and Reports Manager held this
permission previously and no longer do: the screen reports takings and
fulfilment, which is outside what either role is meant to see. Every other role
gets `403`.

| Role | Access |
|---|---|
| `temple_admin` | ✅ |
| `manager` | ✅ |
| `app_manager` | ❌ 403 |
| `reports_manager` | ❌ 403 |
| `counter_staff`, `store_staff`, `temple_poojari`, `temple_user` | ❌ 403 |

> The temple's name and address are **not** returned — they are hardcoded in the
> frontend.

---

## 2. Full response

```json
{
  "date": "2026-08-14",
  "pooja_bookings": {
    "today": 8,
    "next_7_days": [
      { "date": "2026-08-14", "weekday": "Fri", "is_today": true,  "count": 8 },
      { "date": "2026-08-15", "weekday": "Sat", "is_today": false, "count": 11 },
      { "date": "2026-08-16", "weekday": "Sun", "is_today": false, "count": 6 },
      { "date": "2026-08-17", "weekday": "Mon", "is_today": false, "count": 14 },
      { "date": "2026-08-18", "weekday": "Tue", "is_today": false, "count": 19 },
      { "date": "2026-08-19", "weekday": "Wed", "is_today": false, "count": 21 },
      { "date": "2026-08-20", "weekday": "Thu", "is_today": false, "count": 9 }
    ],
    "next_7_days_total": 88,
    "collected_this_month": 184600.0
  },
  "counter_bookings": {
    "collection_today": 12150.0,
    "receipts_today": 1,
    "poojas_booked_today": 19,
    "last_7_days": [
      { "date": "2026-08-08", "weekday": "Sat", "is_today": false, "amount": 0.0,     "receipts": 0 },
      { "date": "2026-08-09", "weekday": "Sun", "is_today": false, "amount": 0.0,     "receipts": 0 },
      { "date": "2026-08-10", "weekday": "Mon", "is_today": false, "amount": 0.0,     "receipts": 0 },
      { "date": "2026-08-11", "weekday": "Tue", "is_today": false, "amount": 0.0,     "receipts": 0 },
      { "date": "2026-08-12", "weekday": "Wed", "is_today": false, "amount": 0.0,     "receipts": 0 },
      { "date": "2026-08-13", "weekday": "Thu", "is_today": false, "amount": 0.0,     "receipts": 0 },
      { "date": "2026-08-14", "weekday": "Fri", "is_today": true,  "amount": 12150.0, "receipts": 1 }
    ],
    "collected_this_month": 12150.0
  },
  "store_orders": {
    "window": 15,
    "fulfilment": {
      "pending": 1,
      "confirmed": 0,
      "processing": 3,
      "packed": 1,
      "shipped": 3,
      "delivered": 6,
      "cancelled": 1
    },
    "open": 7,
    "delivered": 6,
    "cancelled": 1
  },
  "poojari_management": {
    "awaiting_completion": 2,
    "overdue": 1
  },
  "devotees": {
    "total": 12,
    "active": 11,
    "suspended": 1
  }
}
```

`date` is the server's day in **Asia/Kolkata**, read once for the whole
response — a request served across midnight cannot report one card's today and
another's tomorrow.

---

## 3. Pooja bookings

*Online + counter combined.*

| Field | Meaning |
|---|---|
| `today` | Bookings scheduled for today. Same value as `next_7_days[0].count`. |
| `next_7_days` | One entry per day, **today first**, always 7 entries. |
| `next_7_days_total` | Sum of the series, sent so the card need not re-add it. |
| `collected_this_month` | Pooja order revenue since the 1st, net of refunds. |

### What counts as a booking

One `PoojaOrderLine` = one pooja, for one person, on one date. A family booking
three poojas for two people on two dates is **12 bookings**, not one order.

A booking is counted when **both** of these hold:

- the booking's own `status` is `confirmed` (not `cancelled`, not `refunded`),
- its order's `status` is `confirmed` or `completed`.

So the following are **excluded**:

| Excluded | Why |
|---|---|
| Order still `pending` | Not paid for — not yet a pooja the temple has undertaken. |
| Order `cancelled` / `refunded` | Called off. |
| Single date pulled off a standing order | The line is `cancelled`; its order-mates still count. |
| `pooja_status = cancelled` | Will not be performed. |

An agent-code booking awaiting settlement at the desk **is** counted: the money
is outstanding but the pooja is booked and somebody has to perform it.

### Dates

A regular pooja carries its date on the booking (`selected_date`); a special
pooja carries it on the date it was booked against
(`special_pooja_date.date`). The endpoint collapses the two into one column
before grouping, so both kinds land in the right bucket. This mirrors what
`AllBookingsView` does, which is why the dashboard's "today" and the bookings
feed's "today" are the same rows.

### `collected_this_month`

Counted over **orders**, not bookings — the money was taken once for the whole
family, so summing per booking would multiply it by the number of people on the
order.

An order contributes when its payment status is `paid` or `partially_refunded`,
and it contributes `total + additional_charges − refund_amount −
reconciled_amount`. Orders that are pending, cancelled, refunded, or awaiting
counter payment contribute nothing. This is `order_views._money_totals` — the
same function and the same rule the order list's total tile uses.

---

## 4. Counter bookings

*Money taken at the desk.* Cancelled receipts are excluded everywhere — a
voided sale is money the temple does not hold, and counting it would make the
dashboard disagree with the desk's own receipt book.

| Field | Meaning |
|---|---|
| `collection_today` | Sum of today's completed receipts. |
| `receipts_today` | How many receipts were issued today. |
| `poojas_booked_today` | Pooja occurrences settled today (people × dates). |
| `last_7_days` | One entry per day, **today last**, always 7 entries. |
| `collected_this_month` | Counter takings since the 1st. |

> **The counter series looks backwards, the pooja series looks forwards.** A
> receipt is money already taken, so there is nothing in the future to plot; a
> booking is work still to come. `is_today` marks the current day in both, so
> the chart can highlight it without recomputing the direction.

Days are bucketed in Asia/Kolkata, so a sale rung up at 11pm lands on the day
the desk rang it up rather than the UTC day it was stored on.

---

## 5. Store orders

The fulfilment breakdown over the shop's **most recent `window` orders** —
a snapshot of the queue as it stands, not a period total. The card is labelled
"last 15 orders" for that reason.

| Field | Meaning |
|---|---|
| `window` | How many orders were counted (15, or fewer if the shop has fewer). |
| `fulfilment` | Every status, including the empty ones. Always sums to `window`. |
| `open` | `confirmed + processing + packed + shipped`. |
| `delivered` | Convenience mirror of `fulfilment.delivered`. |
| `cancelled` | Convenience mirror of `fulfilment.cancelled`. |

`fulfilment` always carries **all seven** statuses, zero-filled. A card
rendering a fixed set of rows should not have to guess whether a missing key
means zero or means the backend forgot.

`open` deliberately excludes `pending`: an order whose payment has not landed
is not work the shop can start. It also excludes `delivered` and `cancelled`,
which are finished either way. Because `pending` is in `fulfilment` but not in
`open`, **`open + delivered + cancelled` does not necessarily equal `window`** —
use `fulfilment` when you need the parts to add up.

---

## 6. Poojari management

*Work that has stopped moving.* Two counts of bookings the back office still
owes an action on — the card is a way into the bookings screen, not a total to
read and forget.

| Field | Meaning |
|---|---|
| `awaiting_completion` | The booking's day has passed and it is still `pending`. |
| `overdue` | The 24h window its assignment opened has lapsed, still `pending`. |

Both are counted over bookings that are still standing and still unperformed —
the booking's own `status` is `confirmed`, its order's is `confirmed` or
`completed`, and its `pooja_status` is `pending`. That is the same set §3
counts, so a booking on this card is a booking the "today"/"next 7 days"
figures also recognise.

### The two overlap on purpose

A booking assigned yesterday *for* yesterday is both awaiting **and** overdue,
and it is counted in both. It is one row needing one action either way, and
subtracting one figure from the other would report fewer stuck bookings than
there are. **Do not add them together** — render them as two independent
counts, which is what the card does.

### Dates and deadlines are different clocks

`awaiting_completion` reads the booking's own date, collapsed the same way §3
collapses it (`selected_date`, or `special_pooja_date.date` for a special
pooja). It is a **calendar day** comparison in Asia/Kolkata, so today's
bookings are never awaiting — the day is not over yet.

`overdue` reads `complete_by`, a **timestamp** set when the booking was
assigned (`ASSIGNMENT_COMPLETION_WINDOW`, currently 24 hours). A booking nobody
has assigned has no `complete_by` and can never be overdue, however old it is —
it will show up under `awaiting_completion` instead.

This is the same rule `PoojaOrderLine.is_overdue` answers per row, expressed as
SQL so the card can count the table. A test pins the two together: the card
must not contradict the `is_overdue` flag the booking detail panel renders.

---

## 7. Devotees

*Who the app has signed up, and how many of them can still sign in.*

| Field | Meaning |
|---|---|
| `total` | Every devotee account — `active + suspended`. |
| `active` | Can sign in. |
| `suspended` | Sign-in revoked; every booking and receipt they earned is intact. |

The same three tiles the **App > Devotees** screen puts above its table, and
literally the same code (`devotee_views.devotee_summary`) — the card is a way
*in* to that screen, and a landing page whose total disagrees with the screen it
links to is worse than no card at all. Click-through is
`/devotees?status=active` / `?status=suspended`, which is exactly what those
tiles do there.

Counted over **every** devotee. On the Devotees screen the tiles narrow with the
search box; a dashboard has no search box, so these are always the unfiltered
figures. Staff and poojari accounts are not counted — the Devotees screen `404`s
on them, so a tile that links to it must not count them either.

### `null` means "not yours to see"

`devotees` is `null` when the caller does not hold `rbac.view_devotees`. Hide
the card; do not render it as zero.

Admin and Manager hold both permissions, so this only arises for a custom role
built in the role editor that was given the dashboard and not the devotees. The
dashboard must not be a way around a gate the Devotees screen enforces, and
`null` rather than a missing key lets a client tell "you may not see this" from
"the backend forgot" — the same reason `fulfilment` lists its zero statuses.

The rest of the response is unaffected: this is one card withheld, not a refused
request.

---

## 8. What is deliberately not here

- **Poojari management → "reassigned"** — the other two tiles on that card are
  served (see [§6](#6-poojari-management)); this third one is not, because it
  is not derivable. `PoojaOrderLine.assign_poojari()` overwrites `poojari` in
  place with no history and no counter, so a booking handed to a second poojari
  is indistinguishable from one assigned once. Counting it needs a schema
  change — a reassignment counter on the booking, or an assignment history
  table — and a made-up figure on a card the temple acts on would be worse than
  an absent one.
- **Inventory stock alerts** — the data exists
  (`ProductVariant.low_stock_threshold`, `Stock.quantity`); the card is served
  by the store product list's `stock_state` filter
  (`GET /api/admin/store/products/?stock_state=out_of_stock|low_stock`) rather
  than duplicated here.

Also not returned: the temple's name and address (hardcoded in the frontend),
and the quick-action buttons, which post to their own existing endpoints.
