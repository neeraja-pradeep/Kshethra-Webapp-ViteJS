# Pooja bookings API

`/api/admin/bookings/`

The back office's **execution view**: what the temple has to perform, as
opposed to what the devotee paid for.

> **One row is one booking — one pooja, for one person, on one date.**
> A family checking out together is a single `PoojaOrder` but as many bookings
> as there are poojas × people × dates, and each of those is assigned to a
> poojari and completed on its own. This API reads and writes *bookings*
> (`PoojaOrderLine`), never orders.

Its counterpart is [`GET /api/admin/orders/all/`](order-list.md) — the same
poojas seen as money, one row per order, with the occurrences collapsed into
"3 × Ganapathi Homa". One screen counts money, the other counts work.
`order_reference` on every booking is what ties the two together.

Every example below is a response captured from the running API, with the
sample data's names tidied.

---

## Contents

1. [Auth and permissions](#1-auth-and-permissions)
2. [The bookings feed](#2-the-bookings-feed)
3. [Filters](#3-filters)
4. [Sorting and paging](#4-sorting-and-paging)
5. [Mark bookings as performed](#5-mark-bookings-as-performed)
6. [Assign or reassign the poojari](#6-assign-or-reassign-the-poojari)
7. [The 24-hour completion window](#7-the-24-hour-completion-window)
8. [How assignment looks to the poojari](#8-how-assignment-looks-to-the-poojari)
9. [Field reference](#9-field-reference)
10. [Error responses](#10-error-responses)

---

## 1. Auth and permissions

Session cookies, same as the rest of the API — see
[`API_PERMISSIONS.md`](../../API_PERMISSIONS.md) §1–3. Send
`credentials: "include"` on every request and the CSRF header on writes.

| Endpoint | Permission required |
|---|---|
| `GET /api/admin/bookings/all/` | `rbac.manage_pooja_orders` **+** `booking.view_poojaorderline` |
| `POST /api/admin/bookings/complete/` | `rbac.manage_pooja_orders` **+** `booking.change_poojaorderline` |
| `POST /api/admin/bookings/assign/` | `rbac.assign_poojari` **+** `booking.change_poojaorderline` |

Assignment sits behind its own permission on purpose: rostering the temple's
poojaris is a different job from handling an order, so a duty manager can be
allowed to move work between poojaris without being trusted with refunds.
`temple_admin` holds all of them out of the box.

---

## 2. The bookings feed

```
GET /api/admin/bookings/all/
```

**Response `200`** (two bookings on one order — same devotee, same date, two
poojas, two poojaris, two states):

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 22,
      "order_id": 12,
      "order_reference": "PO-12",
      "channel": "app",
      "booked_by": {
        "name": "Lakshmi Iyer",
        "phone_number": null,
        "staff_name": null
      },
      "pooja": {
        "id": 11,
        "name": "Ganapathi Homa",
        "special_pooja": false,
        "gods": [{ "id": 19, "name": "Ganesha" }]
      },
      "pooja_date": "2026-08-13",
      "pooja_time": null,
      "person": { "name": "Lakshmi", "nakshatram": "Ashwini" },
      "poojari": { "id": 24, "name": "Sharma Sastrigal" },
      "pooja_status": "completed",
      "line_status": "confirmed",
      "assigned_at": null,
      "complete_by": null,
      "is_overdue": false,
      "completed_at": null,
      "price": "751.00",
      "remarks": null,
      "order": {
        "receipt_no": null,
        "total": "1252.00",
        "payment_status": "paid",
        "payment_method": "razorpay",
        "refund_status": "none",
        "refund_amount": "0.00"
      },
      "created_at": "2026-08-10T18:07:43.856792Z"
    }
  ],
  "summary": { "total": 2, "pending": 1, "completed": 1, "cancelled": 0 }
}
```

Three things to know about the shape:

- **`summary` counts the whole filtered set, not the page.** The tiles above
  the table stay still while you page through it. It follows the filters, so
  filtering to one god re-counts for that god.
- **`pooja_status` is this booking's own state.** The order it belongs to has
  a status too, but it is a roll-up: an order reads `completed` only once every
  booking still standing on it does. Completing one pooja for one person does
  not declare the rest of the family's bookings done.
- **`line_status` is the money, `pooja_status` is the work.** A booking whose
  payment was cancelled or refunded (`line_status`) can never be performed, so
  it reads `cancelled` on both.

The `order` block is what the detail panel shows under "parent order".
Cancellation and refunds are order-level matters — a booking is a share of one
payment — so they are not done through this API.

---

## 3. Filters

All optional, all combinable, all reflected in `summary`.

| Param | Values | Notes |
|---|---|---|
| `date_from`, `date_to` | `YYYY-MM-DD` | **Pooja date**, not order date. Reaches through to the special-pooja date for special poojas. |
| `god` | PoojaCategory id | Matches any of the pooja's gods. |
| `pooja_type` | `special` \| `regular` | |
| `pooja` | Pooja id | |
| `poojari` | User id, or `unassigned` | `unassigned` is bookings nobody is down to perform yet. |
| `channel` | `app` \| `counter` | |
| `status` | `pending` \| `completed` \| `cancelled` | The booking's own execution state. |
| `order_id` | PoojaOrder id | Every booking on one order. |
| `search` | free text | Person, pooja, poojari, booker name/phone, or receipt number. |

`search` covers the person a pooja is *for* on both channels — the saved
profile on an app booking and the name snapshot on a walk-in, who has no
account at all.

An unknown value for `pooja_type`, `channel`, `status` or `sort` is a `400`,
as is a non-numeric id. Filters never fail silently.

---

## 4. Sorting and paging

```
GET /api/admin/bookings/all/?sort=-pooja_date&page=2&page_size=20
```

| Param | Default | Notes |
|---|---|---|
| `sort` | `pooja_date` | Prefix with `-` to reverse. |
| `page` | 1 | |
| `page_size` | 10 | Max 100. |

Sortable columns: `pooja`, `pooja_date`, `person`, `poojari`,
`pooja_status`, `order`, `created_at`.

The default is the date the pooja is performed, not the date it was ordered —
this is the list the temple works down.

Two behaviours worth relying on:

- **Nulls sort last in either direction.** A booking with nobody assigned, or
  with no date resolvable, is not what the temple wants at the top of its
  working list, and reversing the sort does not put it there.
- **Every sort tie-breaks on booking id**, so paging cannot repeat or skip a
  row when two bookings tie on the sorted column.

`person` sorts across both channels: the name lives in different columns for
app bookings and walk-ins, and the sort collapses them so the column orders the
way it reads.

---

## 5. Mark bookings as performed

```
POST /api/admin/bookings/complete/
```

```json
{ "booking_ids": [22] }
```

Send one id for a single row, or several for a batch of ticked rows.

**Response `200`** — the updated bookings, in feed row shape, so the table can
patch itself without refetching:

```json
{ "bookings": [ { "id": 22, "pooja_status": "completed", "...": "..." } ] }
```

- **It does not touch `poojari`.** An admin recording that a pooja happened is
  not claiming to have performed it, so whoever was assigned keeps the booking.
  `completed_at` and `completed_by` record who closed it off.
- **Completing an already-completed booking is a no-op**, not an error, so a
  double-clicked button does not fail.
- **The order's status follows.** Once every booking standing on an order is
  completed, the order reads `completed` too.

---

## 6. Assign or reassign the poojari

```
POST /api/admin/bookings/assign/
```

```json
{ "booking_ids": [23], "poojari": 24 }
```

**Response `200`** (abridged — the full feed row comes back):

```json
{
  "bookings": [
    {
      "id": 23,
      "poojari": { "id": 24, "name": "Sharma Sastrigal" },
      "pooja_status": "pending",
      "assigned_at": "2026-08-10T18:08:34.542524Z",
      "complete_by": "2026-08-11T18:08:34.542524Z",
      "is_overdue": false
    }
  ]
}
```

- **Assignment is per booking.** Reassigning one pooja leaves the others on the
  same order with whoever they had. This is the whole point of the screen: two
  poojas in one order routinely belong to two different poojaris.
- **Only a booking still waiting can be assigned.** A completed one is history
  and a cancelled one is not going to happen; both are a `400`.
- **The poojari must be an activated `temple_poojari`** — the same set the
  admin's poojari dropdown offers. A devotee id, or a poojari registered but
  never signed in, is a `400`.

### Both endpoints are all-or-nothing

The bookings are loaded and checked first, and one refusal fails the whole
request with nothing applied. Ticking four rows and getting two of them done,
with no clear record of which, is worse than getting an error and trying again.

---

## 7. The 24-hour completion window

Assigning a booking starts a clock. `complete_by` is stamped 24 hours out and
returned on every row; `is_overdue` goes `true` once it passes.

**Nothing expires on its own.** No background job clears the assignment or
changes the status — the back office sees the booking flagged overdue and
decides. `is_overdue` is derived, so it is always current.

- A booking a poojari picked up themselves has no `complete_by` at all — they
  were never put on the admin's clock.
- A performed booking is never overdue, whatever its deadline says.
- Reassigning restarts the clock from the moment of reassignment.

---

## 8. How assignment looks to the poojari

Assignment is not just back-office metadata; it changes what the poojari app
shows and allows. The rule is **mine, or nobody's**:

| | Poojari's app (`/api/poojari/pooja-management/`) |
|---|---|
| Booking assigned to them | Listed, and they may perform it |
| Booking nobody has been assigned | Listed, and performing it claims it for them |
| Booking assigned to another poojari | Not listed; performing it is a `403` |

So reassigning a booking in the back office genuinely moves the work: it leaves
the previous poojari's list and appears on the new one's.

`PoojaOrder.poojari` still exists for older readers (reports, the admin order
viewset, order filters), but it is now derived — it names a poojari only when
every booking still standing on the order agrees, and is `null` for an order
split between two of them.

---

## 9. Field reference

### Booking row

| Field | Type | Notes |
|---|---|---|
| `id` | int | The booking (`PoojaOrderLine`) id — what the write endpoints take |
| `order_id` | int | The order it was paid on |
| `order_reference` | string | `PO-{order_id}` |
| `channel` | string | `app` \| `counter` |
| `booked_by` | object\|null | Who placed it: `name`, `phone_number`, `staff_name` |
| `pooja` | object | `id`, `name`, `special_pooja`, `gods[]` (primary god first) |
| `pooja_date` | date\|null | The date it is performed |
| `pooja_time` | string\|null | Set only for special poojas with a time |
| `person` | object | Who it is *for*: `name`, `nakshatram` |
| `poojari` | object\|null | `null` when nobody is assigned |
| `pooja_status` | string | `pending` \| `completed` \| `cancelled` — the work |
| `line_status` | string | `confirmed` \| `cancelled` \| `refunded` — the money |
| `assigned_at` | datetime\|null | When an admin last assigned it |
| `complete_by` | datetime\|null | Deadline; `null` if no admin assigned it |
| `is_overdue` | bool | Past `complete_by` and still pending |
| `completed_at` | datetime\|null | |
| `price` | decimal string | This booking's share of the order |
| `remarks` | string\|null | |
| `order` | object | The parent-order block, below |
| `created_at` | datetime | When the order was placed |

### `booked_by`

`name` is the devotee who placed it. On a walk-in the payer has no account, so
the name comes off the receipt and `staff_name` is the counter staff who rang
it up. On an app booking `staff_name` is `null`.

> `order.user` on a counter order is the **staff member**, not the devotee.
> Read `booked_by`, not the order's user, or walk-ins will be attributed to
> whoever was on the desk.

### `order`

| Field | Type | Notes |
|---|---|---|
| `receipt_no` | string\|null | e.g. `RCP-1001`; `null` for app bookings |
| `total` | decimal string | The whole order, not this booking |
| `payment_status` | string | `paid`, `pending`, `awaiting_counter_payment`, `cancelled`, `refund_pending`, `refunded`, `partially_refunded` |
| `payment_method` | string | |
| `refund_status` | string | |
| `refund_amount` | decimal string | |

`partially_refunded` means some of the money is still the temple's — bookings
on one order can be cancelled one at a time.

`awaiting_counter_payment` is an agent-code booking the devotee settles at the
desk. It is *not* late — showing it as plain `pending` reads as overdue when
the arrangement was always to pay in person. A refund still outranks it: what
the money did last is what the row reports.

---

## 10. Error responses

| Status | When | Body |
|---|---|---|
| `400` | Unknown filter value | `{"channel": "Expected one of app, counter."}` |
| `400` | Non-numeric id filter | `{"god": "Expected a whole number."}` |
| `400` | Unknown sort | `{"sort": "Expected one of created_at, order, person, pooja, pooja_date, pooja_status, poojari, optionally prefixed with '-'."}` |
| `400` | Empty `booking_ids` | `{"booking_ids": ["This list may not be empty."]}` |
| `400` | Booking cannot take the action | `{"detail": "This booking was cancelled and cannot be completed."}` |
| `400` | Already performed | `{"detail": "This booking has already been performed and cannot be assigned."}` |
| `400` | Not a poojari | `{"poojari": "No poojari with that id."}` |
| `400` | Poojari never activated | `{"poojari": "Gopal Iyer has not activated their account yet."}` |
| `404` | Unknown booking id | `{"booking_ids": "No booking with id 99999."}` |
| `403` | Caller lacks the permission | standard DRF body |
