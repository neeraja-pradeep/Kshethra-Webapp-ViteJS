# Order list API

`/api/admin/orders/all/`

The back office's **money view**: every order the temple has taken, newest
first, with the tiles above the table counted over the whole filtered set.

> **One row is one order — one checkout.** However many poojas, however many
> family members, however many dates. The occurrences underneath are collapsed
> into `items` ("2 × Satyanarayana Pooja") and counted in `item_count`.

The feed unions two tables into one shape:

| `source` | Table | What it is |
|---|---|---|
| `pooja` | `booking.PoojaOrder` | A pooja booking — from the app (`channel: "app"`) or rung up at the counter (`channel: "counter"`). |
| `product` | `e_commerce.Order` | A shop order for physical products. The shop has no counter channel. |

Pass `?source=pooja` for the Pooja Orders screen; omit it to see both.

Its neighbours:

| Endpoint | Answers |
|---|---|
| `GET /api/admin/orders/all/` | *What orders are there?* This document. |
| `GET /api/admin/orders/pooja/<id>/` | *What is this one?* [pooja-orders.md](pooja-orders.md). |
| `GET /api/admin/bookings/all/` | *What has to be performed?* [pooja-bookings.md](pooja-bookings.md). |

Counter sales are **not** read from `CounterReceipt`. Every walk-in receipt has
a `PoojaOrder` behind it, so reading receipts as well would show the same money
twice; the receipt is joined onto its order and surfaced in `counter` instead.

Every example below is a response captured from the running API, with the
sample data's names tidied.

---

## Contents

1. [Auth and permissions](#1-auth-and-permissions)
2. [The feed](#2-the-feed)
3. [The tiles](#3-the-tiles)
4. [What counts as revenue](#4-what-counts-as-revenue)
5. [Payment status](#5-payment-status)
6. [Filters](#6-filters)
7. [Search](#7-search)
8. [Paging and ordering](#8-paging-and-ordering)
9. [Field reference](#9-field-reference)
10. [Error responses](#10-error-responses)

---

## 1. Auth and permissions

Session cookies, same as the rest of the API — see
[`API_PERMISSIONS.md`](../../API_PERMISSIONS.md) §1–3. Send
`credentials: "include"` on every request.

| Endpoint | Permission required |
|---|---|
| `GET /api/admin/orders/all/` | `rbac.manage_pooja_orders` **+** `booking.view_poojaorder` **+** `e_commerce.view_order` |

Both model permissions are required even when you ask for one `source`: the
endpoint can serve either table, so it is authorised for both up front.
`temple_admin` holds all of them out of the box.

---

## 2. The feed

```http
GET /api/admin/orders/all/?source=pooja&page_size=2
```

```json
{
  "count": 5,
  "next": "http://localhost:8000/api/admin/orders/all/?page=2&page_size=2&source=pooja",
  "previous": null,
  "results": [
    {
      "source": "pooja",
      "id": 5,
      "reference": "PO-5",
      "order_group_id": null,
      "channel": "app",
      "customer": {
        "id": 2,
        "name": "Jayanth Kumar",
        "email": "jayanth.kumar@example.in",
        "phone_number": "9888112071"
      },
      "status": "cancelled",
      "pooja_status": "pending",
      "payment_status": "refunded",
      "payment_method": "upi",
      "total": "251.00",
      "refund_status": "processed",
      "refund_amount": "251.00",
      "item_count": 1,
      "distinct_item_count": 1,
      "agent_code": null,
      "items": [
        { "name": "Satyanarayana Pooja", "quantity": 1, "amount": "251.00" }
      ],
      "counter": null,
      "created_at": "2026-08-11T18:05:05.386995Z"
    },
    {
      "source": "pooja",
      "id": 4,
      "reference": "PO-4",
      "order_group_id": null,
      "channel": "app",
      "customer": {
        "id": 2,
        "name": "Jayanth Kumar",
        "email": "jayanth.kumar@example.in",
        "phone_number": "9888112071"
      },
      "status": "confirmed",
      "pooja_status": "pending",
      "payment_status": "partially_refunded",
      "payment_method": "netbanking",
      "total": "1502.00",
      "refund_status": "processed",
      "refund_amount": "751.00",
      "item_count": 2,
      "distinct_item_count": 1,
      "agent_code": null,
      "items": [
        { "name": "Satyanarayana Pooja", "quantity": 2, "amount": "1502.00" }
      ],
      "counter": null,
      "created_at": "2026-08-11T18:05:05.384837Z"
    }
  ],
  "summary": {
    "total": 5,
    "amount": "4353.00",
    "refunds": { "count": 2, "amount": "1002.00" },
    "by_payment_status": {
      "awaiting_counter_payment": 1,
      "paid": 2,
      "partially_refunded": 1,
      "refunded": 1
    }
  }
}
```

### An agent-code order, payable at the counter

`agent_code` is what the list shows under the devotee's name. Its
`payment_status` is **not** `pending` — nothing is late, the arrangement is
that the devotee pays at the desk.

```json
{
  "source": "pooja",
  "id": 2,
  "reference": "PO-2",
  "channel": "app",
  "customer": { "id": 2, "name": "Jayanth Kumar", "email": "jayanth.kumar@example.in", "phone_number": "9888112071" },
  "status": "pending",
  "pooja_status": "pending",
  "payment_status": "awaiting_counter_payment",
  "payment_method": "cod",
  "total": "5500.00",
  "refund_status": "none",
  "refund_amount": "0.00",
  "item_count": 1,
  "distinct_item_count": 1,
  "agent_code": { "id": 1, "name": "GURUKRIPA" },
  "items": [ { "name": "Maha Rudrabhishekam", "quantity": 1, "amount": "5500.00" } ],
  "counter": null,
  "created_at": "2026-08-11T18:05:05.368224Z"
}
```

### A walk-in counter sale

A walk-in devotee has no account, so `customer` is the payer snapshot off the
receipt rather than `order.user` — which on a counter order is the staff member
who rang it up. They are named in `counter.staff_name`, which is what the
"Booked via" column shows beneath **Counter**.

```json
{
  "source": "pooja",
  "id": 3,
  "reference": "PO-3",
  "channel": "counter",
  "customer": { "id": null, "name": "Ramesh Pillai", "email": null, "phone_number": "9000000001" },
  "status": "confirmed",
  "pooja_status": "pending",
  "payment_status": "paid",
  "payment_method": "cash",
  "total": "2100.00",
  "item_count": 1,
  "distinct_item_count": 1,
  "agent_code": null,
  "items": [ { "name": "Maha Rudrabhishekam", "quantity": 1, "amount": "2100.00" } ],
  "counter": {
    "receipt_id": 1,
    "receipt_no": "RCP-1001",
    "sale_type": "walk_in",
    "payment_method": "cash",
    "status": "completed",
    "staff_name": "Ravi Kumar"
  },
  "created_at": "2026-08-11T18:05:05.379336Z"
}
```

---

## 3. The tiles

`summary` rides on the paginated response and is counted over **the whole
filtered set, not the page** — an admin filtering to a week wants that week's
takings, and a figure that changed as you paged would be worthless. Change a
filter and every number moves with it.

| Field | Tile | Meaning |
|---|---|---|
| `total` | *N orders* | How many orders matched. |
| `amount` | *Revenue* | What the temple has actually taken and kept. See §4. |
| `refunds.count` / `refunds.amount` | *N refunds* | Orders with money on its way back through the gateway, and how much. Counted from `refund_amount > 0`, so a refund still pending is already in here. |
| `by_payment_status` | the status chips | One count per status present. |

`by_payment_status` **omits statuses with no orders** — render a tile of `0`
from the keys you expect rather than from the keys you get.

Every key in `by_payment_status` is a value `?payment_status=` accepts, so each
tile clicks straight through to the rows behind it, and the two agree:

```http
GET /api/admin/orders/all/?source=pooja&payment_status=partially_refunded
→ count: 1        # matches by_payment_status.partially_refunded
```

An empty result still carries tiles:

```json
"summary": { "total": 0, "amount": "0.00", "refunds": { "count": 0, "amount": "0.00" }, "by_payment_status": {} }
```

---

## 4. What counts as revenue

`summary.amount` is **takings, not billings**. An order counts only once its
money is really in, and only for the part that stayed:

```
revenue = Σ (total + additional_charges − refund_amount − reconciled_amount)
          over orders whose payment_status is "paid" or "partially_refunded"
```

`reconciled_amount` is money settled outside the gateway — a date cancelled
off a paid order is paid back by hand at the desk, not by Razorpay (see
[pooja-orders.md §6](pooja-orders.md#6-refunded-vs-reconciled)). It has still
left the temple, so it comes off revenue too.

What each state contributes, on a ₹1,000 order:

| `payment_status` | Contributes | Why |
|---|---|---|
| `paid` | 1000.00 | The money is in. |
| `partially_refunded` (400 back) | 600.00 | Worth what was not sent back. |
| `paid`, 250 reconciled | 750.00 | The hand-settled part has left too. |
| `pending` | 0.00 | Not paid for yet. |
| `awaiting_counter_payment` | 0.00 | Nothing collected until it is settled at the desk. |
| `cancelled` | 0.00 | Out entirely, whether or not the refund has been processed. |
| `refund_pending` | 0.00 | On its way back. |
| `refunded` | 0.00 | Gone back. |

So the tiles will not add up to the `total` column summed down the page, and
they are not meant to: **`amount` is already net**, so do not subtract
`refunds.amount` from it a second time.

> Note that `refunds` counts gateway refunds only. An order given back entirely
> by reconciliation drops out of `amount` but reports `refunds.count: 0`.

---

## 5. Payment status

`payment_status` is derived, not stored — one vocabulary across both tables:

| Value | Means | Where it comes from |
|---|---|---|
| `paid` | Money in hand. | Order status `confirmed`/`completed` — or the shop's own `payment_status`. |
| `pending` | Not paid for yet. | Anything earlier. |
| `awaiting_counter_payment` | Payable at the counter. | An app order on an agent code, `cod`, no receipt yet, not cancelled. |
| `failed` | The payment failed. | Shop orders only. |
| `cancelled` | The order was called off. | Order status `cancelled`, with no refund recorded. |
| `refund_pending` | A refund has started. | `refund_status = "pending"`. |
| `partially_refunded` | Some of it came back. | `refund_status = "processed"` and `0 < refund_amount < total`. |
| `refunded` | All of it came back. | `refund_status = "processed"` otherwise. |

A refund wins over everything else — it is what the money did last. `status`
and `refund_status` are on the row too, so a row that is both cancelled *and*
refunded can be shown either way without re-deriving anything.

---

## 6. Filters

All optional, all combinable, and all reflected in `summary`.

| Parameter | Accepts | Notes |
|---|---|---|
| `source` | `pooja`, `product` | Both when omitted. |
| `channel` | `app`, `counter` | `counter` returns pooja rows only — the shop has no counter channel. |
| `payment_status` | the eight values in §5 | The tile click-through. |
| `pooja_status` | `pending`, `completed`, `cancelled` | Pooja rows only; shop orders drop out. |
| `agent_code` | an `AgentCode` id | Pooja rows only; the shop takes no agent codes. |
| `status` | an order status | Exact match on the stored `status`. |
| `payment_method` | `razorpay`, `cod`, `cash`, `card`, `upi`, `netbanking` | Exact match. |
| `date_from`, `date_to` | `YYYY-MM-DD` | Inclusive, on **`created_at`** — when the order was placed. |
| `search` | free text | See §7. |
| `page`, `page_size` | integers | See §8. |

```http
GET /api/admin/orders/all/?source=pooja&agent_code=1
GET /api/admin/orders/all/?source=pooja&channel=counter&payment_status=paid
GET /api/admin/orders/all/?source=pooja&date_from=2026-06-29&date_to=2026-07-21
```

> `date_from`/`date_to` filter the **order date**, not the date a pooja is to be
> performed. To filter by when the temple has to do the work, use
> [`/api/admin/bookings/all/`](pooja-bookings.md#3-filters), whose date window
> runs on the pooja date.

---

## 7. Search

One `search` term is matched against, in one `OR`:

- the **order reference** — `PO-2041`, lowercase `po-2041`, or the bare `2041`
- customer name, email and phone
- the counter receipt number, and the walk-in payer's name and phone
- the pooja name (or, for shop orders, the product name)

```http
GET /api/admin/orders/all/?source=pooja&search=PO-4      → the one order
GET /api/admin/orders/all/?source=pooja&search=RCP-1001  → the walk-in
GET /api/admin/orders/all/?source=pooja&search=Rudra     → every order with that pooja on it
```

Two things to know:

- **The other table's prefix matches nothing.** `?source=pooja&search=SO-4`
  returns 0 — a shop reference must not turn up pooja order 4.
- **A bare number is one clause among many.** `?search=4` matches order `PO-4`
  *and* any phone number or name containing a 4. Send the prefixed reference
  when you mean the reference.

---

## 8. Paging and ordering

Standard page-number pagination: `?page=`, `?page_size=` (default 10, max 100).
`count` is the whole filtered set; `summary` is too.

Ordering is fixed: **newest first**, by `created_at` then `id`. The two tables
are unioned and paginated in the database, so only the rows on the page you
asked for are ever loaded in full — there is no `?sort=` here. (The bookings
feed does have one, because that list is worked down in date order.)

---

## 9. Field reference

### Row

| Field | Type | Notes |
|---|---|---|
| `source` | string | `pooja` or `product`. |
| `id` | int | Primary key **within its table** — only unique alongside `source`. |
| `reference` | string | `PO-<id>` for pooja, `SO-<id>` for shop. What the admin sees and searches. |
| `order_group_id` | string \| null | Legacy per-checkout marker. One order per group now; group on it only for old data. |
| `channel` | string | `app` or `counter`. Always `app` for shop orders. |
| `customer` | object \| null | `{id, name, email, phone_number}`. On a walk-in, the payer off the receipt, with `id: null`. |
| `status` | string | The stored order status. |
| `pooja_status` | string \| null | Execution state rolled up from the bookings. `null` on shop orders. |
| `payment_status` | string | Derived — see §5. |
| `payment_method` | string | |
| `total` | string | Decimal as a string. Excludes `additional_charges`. |
| `refund_status` | string | `none`, `pending`, `processed`, `failed`. |
| `refund_amount` | string | Gateway refunds only. |
| `item_count` | int | **Occurrences** — poojas × people × dates, or units for a shop order. |
| `distinct_item_count` | int | How many *different* poojas, or product variants. One pooja for a family of four is `item_count: 4`, `distinct_item_count: 1`. |
| `agent_code` | object \| null | `{id, name}`. Always `null` on shop orders. |
| `items[]` | array | `{name, quantity, amount}`, occurrences collapsed per pooja. |
| `counter` | object \| null | Present only on a counter sale — see below. |
| `created_at` | datetime | When the order was placed. |

### `counter`

| Field | Notes |
|---|---|
| `receipt_id`, `receipt_no` | The receipt on file, e.g. `RCP-1001`. |
| `sale_type` | `walk_in`, or `agent_booking` for an app order settled at the desk. |
| `payment_method` | How the money was handed over. |
| `status` | `completed` or `cancelled`. |
| `staff_name` | Who took the money. `null` if the account has no name or email. |

### `summary`

See §3 and §4.

---

## 10. Error responses

Every bad parameter is a `400` naming the field and what it accepts.

| Request | Response |
|---|---|
| `?source=nope` | `{"source": "Expected one of pooja, product."}` |
| `?channel=nope` | `{"channel": "Expected one of app, counter."}` |
| `?payment_status=nope` | `{"payment_status": "Expected one of paid, pending, awaiting_counter_payment, failed, cancelled, refund_pending, refunded, partially_refunded."}` |
| `?pooja_status=nope` | `{"pooja_status": "Expected one of pending, completed, cancelled."}` |
| `?agent_code=abc` | `{"agent_code": "Expected a whole number."}` |
| `?date_from=11-08-2026` | `{"date_from": "Expected a date as YYYY-MM-DD."}` |

| Status | When |
|---|---|
| `401` | Not signed in. |
| `403` | Signed in without the permissions in §1. |
