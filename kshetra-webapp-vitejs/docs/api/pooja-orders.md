# Pooja order detail API

`/api/admin/orders/pooja/<order_id>/`

One order, in full — everything the **order detail page** draws — plus the
three things done from that page: cancel the whole order, cancel single dates
out of it, and print the receipt.

> **One order is one checkout.** However many poojas, however many family
> members, however many dates. The detail payload keeps that shape: `poojas[]`
> → `dates[]` → `users[]`, where one `users[]` entry is one booking
> (`PoojaOrderLine`) — the thing that is assigned to a poojari, performed, and
> cancellable on its own.

Its neighbours:

| Endpoint | Answers |
|---|---|
| `GET /api/admin/orders/all/` | *What orders are there?* One row per order — [order-list.md](order-list.md). |
| `GET /api/admin/orders/pooja/<id>/` | *What is this one?* This document. |
| `GET /api/admin/bookings/all/` | *What has to be performed?* One row per booking — [pooja-bookings.md](pooja-bookings.md). |

Every example below is a response captured from the running API.

---

## Contents

1. [Auth and permissions](#1-auth-and-permissions)
2. [The order detail](#2-the-order-detail)
3. [The assignment clock](#3-the-assignment-clock)
4. [Cancelling the whole order](#4-cancelling-the-whole-order)
5. [Cancelling single dates — reconciliation only](#5-cancelling-single-dates--reconciliation-only)
6. [Refunded vs reconciled](#6-refunded-vs-reconciled)
7. [The receipt](#7-the-receipt)
8. [Error responses](#8-error-responses)

---

## 1. Auth and permissions

Session cookies, same as the rest of the API — see
[`API_PERMISSIONS.md`](../../API_PERMISSIONS.md) §1–3. Send
`credentials: "include"` on every request and the CSRF header on writes.

| Endpoint | Permission required |
|---|---|
| `GET /api/admin/orders/pooja/<id>/` | `rbac.manage_pooja_orders` **+** `booking.view_poojaorder` **+** `booking.view_poojaorderline` |
| `GET /api/admin/orders/pooja/<id>/receipt/` | `rbac.manage_pooja_orders` **+** `booking.view_poojaorder` |
| `POST /api/admin/orders/pooja/<id>/cancel/` | `rbac.refund_pooja_order` **+** `booking.change_poojaorder` |
| `POST /api/admin/orders/pooja/<id>/cancel-bookings/` | `rbac.refund_pooja_order` **+** `booking.change_poojaorderline` |

Both cancellations move money — one through the gateway, one as a
reconciliation entry — so both sit behind `refund_pooja_order` rather than the
plain back office scope. `temple_admin` holds all of them out of the box.

---

## 2. The order detail

```
GET /api/admin/orders/pooja/<order_id>/
```

**Response `200`** (one pooja, one date, one devotee, assigned to a poojari):

```json
{
  "source": "pooja",
  "id": 2071,
  "reference": "PO-2071",
  "order_group_id": null,
  "channel": "app",
  "channel_display": "Mobile app",
  "created_at": "2026-07-27T08:15:00Z",
  "status": "confirmed",
  "pooja_status": "pending",
  "customer": {
    "id": 2,
    "name": "Jayanth Kumar",
    "email": "jayanth.kumar@example.in",
    "phone_number": "+919888112071"
  },
  "booked_by": { "name": "Jayanth Kumar", "phone_number": "+919888112071", "staff_name": null },
  "booked_for": [{ "name": "Jayanth Kumar", "nakshatram": null }],
  "agent_code": null,
  "counter": null,
  "awaiting_counter_payment": false,
  "item_count": 1,
  "poojas": [
    {
      "pooja": {
        "id": 9,
        "name": "Satyanarayana Pooja",
        "category": { "id": 17, "name": "Vishnu" },
        "gods": [{ "id": 17, "name": "Vishnu", "media_url": null }],
        "online_price": "751.00",
        "offline_price": "700.00",
        "special_pooja": false,
        "media_url": null
      },
      "pooja_total": "751.00",
      "dates": [
        {
          "order_id": 2071,
          "order_status": "confirmed",
          "pooja_status": "pending",
          "order_pooja_status": "pending",
          "order_total": "751.00",
          "additional_charges": "0.00",
          "selected_date": "2026-07-30",
          "special_pooja_date": null,
          "users": [
            {
              "order_line_id": 4181,
              "user_list": { "id": 1, "name": "Jayanth Kumar" },
              "user_attribute": null,
              "devotee": { "name": "Jayanth Kumar", "nakshatram": null },
              "price": "751.00",
              "line_status": "confirmed",
              "pooja_status": "pending",
              "poojari": { "id": 3, "name": "Krishnan Namboothiri" },
              "assigned_by": { "id": 1, "name": "Aravind Nair" },
              "assigned_at": "2026-07-29T10:55:54Z",
              "complete_by": "2026-07-30T10:55:54Z",
              "is_overdue": false,
              "completed_at": null,
              "cancelled_at": null,
              "cancel_reason": null
            }
          ]
        }
      ]
    }
  ],
  "payment": {
    "total": "751.00",
    "additional_charges": "0.00",
    "grand_total": "751.00",
    "payment_status": "paid",
    "payment_method": "card",
    "payment_method_display": "Card",
    "razorpay_order_id": null,
    "razorpay_payment_id": "pay_QeF2071",
    "refund_status": "none",
    "refund_amount": "0.00",
    "refund_reason": null,
    "reconciled_amount": "0.00",
    "refundable_amount": "751.00",
    "receipt": { "receipt_no": "RCP-PO-2071", "source": "derived" }
  },
  "cancellation": {
    "cancelled": false,
    "reason": null,
    "cancelled_at": null,
    "cancelled_by": null,
    "can_cancel": true,
    "cancellable_amount": "751.00"
  }
}
```

Reading it:

| Field | What it is |
|---|---|
| `reference` | What the page shows in its title — `PO-2071`. Also what `?search=` on the order list accepts. |
| `customer` | The account the order sits under. On a counter walk-in this is the payer off the receipt, because `order.user` there is the staff member who rang it up. |
| `booked_for` | The people the poojas are performed for, deduplicated — the "booked for" chips. One person on three dates is one chip. |
| `counter` | The receipt block, on a counter sale or a settled agent-code booking. `null` on an ordinary app order. |
| `awaiting_counter_payment` | An agent-code booking the devotee settles at the desk. Not overdue — the money is collected in person. |
| `item_count` | Bookings on the order: poojas × people × dates. |
| `poojas[].dates[].pooja_status` | Rolled up from that date's bookings. The order-wide summary is the top-level `pooja_status`. |
| `poojas[].dates[].users[]` | **One entry is one booking.** `order_line_id` is the id every write below takes. |

`GET /api/booking/admin/orders/<id>/` returns the same blocks on top of its
existing serializer fields, so a client already reading `order_lines` there
keeps working.

---

## 3. The assignment clock

Each `users[]` entry carries its own execution state, because assignment is
per booking — two poojas in one order routinely belong to two poojaris.

| Field | Meaning |
|---|---|
| `poojari` | Who is performing this booking, or `null`. |
| `assigned_by` | Who handed it to them. `null` when no admin has touched it — a poojari who picked the booking up themselves. |
| `assigned_at` | When that happened. A non-null value is what tells the page this poojari was *put* here — the "Reassigned" badge. |
| `complete_by` | The deadline that assignment set: `assigned_at` + 24 hours (`ASSIGNMENT_COMPLETION_WINDOW`). This is what "complete within 24 hours" counts down to. |
| `is_overdue` | Past `complete_by` and still not performed. Nothing expires on its own — the back office is shown the overdue booking and decides. |
| `completed_at` | When it was performed. |

Reassigning restarts the clock. See
[pooja-bookings.md §7](pooja-bookings.md#7-the-24-hour-completion-window) for
the window itself, and `POST /api/admin/bookings/assign/` for the write.

---

## 4. Cancelling the whole order

```
POST /api/admin/orders/pooja/<order_id>/cancel/
{ "reason": "Temple closed for renovation" }
```

`reason` is **required** and non-blank. It is recorded on the order and copied
onto every booking the cancellation calls off, so a cancellation can always be
accounted for afterwards.

What happens to the money depends on how it came in:

| How it was paid | What the endpoint does | `settlement.method` |
|---|---|---|
| Razorpay | Refunds through the gateway there and then | `gateway` |
| Cash/card/UPI at the counter, or a settled agent-code booking | Writes the amount to `reconciled_amount` — the payout is made by hand | `reconciliation` |
| Never collected (agent-code booking still awaiting payment) | Nothing — the order owes nothing back | `none` |

A booking that has **already been performed** keeps its money and its
`completed` status; only what is left is called off and paid back. That is why
`cancellation.cancellable_amount` — what pressing the button would send back
right now — is not always the order total. It is `0.00` on an order whose
money was never collected, and on one whose poojas have all been performed;
the order can still be cancelled in both cases, it simply owes nothing.

**Response `200`** — the whole detail payload again (so the page can re-render
from one response), with a `settlement` block added:

```json
{
  "status": "cancelled",
  "pooja_status": "cancelled",
  "payment": {
    "payment_status": "refund_pending",
    "refund_status": "pending",
    "refund_amount": "751.00",
    "refund_reason": "Temple closed for renovation",
    "reconciled_amount": "751.00",
    "refundable_amount": "0.00"
  },
  "cancellation": {
    "cancelled": true,
    "reason": "Temple closed for renovation",
    "cancelled_at": "2026-08-11T10:56:48Z",
    "cancelled_by": "Aravind Nair",
    "can_cancel": false,
    "cancellable_amount": "0.00"
  },
  "settlement": { "method": "gateway", "amount": "751.00", "reference": "rfnd_Qe9x21" }
}
```

The gateway is called **before** anything is written: a refund the provider
refuses leaves the order exactly as it was, rather than cancelled with no money
behind it.

---

## 5. Cancelling single dates — reconciliation only

```
POST /api/admin/orders/pooja/<order_id>/cancel-bookings/
{ "booking_ids": [4182], "reason": "Devotee could not travel" }
```

`booking_ids` are `order_line_id` values from `poojas[].dates[].users[]` — one
date, or several ticked together. `reason` is optional here.

> **No refund is processed.** A part cancellation is settled outside the
> gateway — cash back at the counter, a bank transfer — so the value of what
> was cancelled is added to `reconciled_amount` and nothing is sent to
> Razorpay.

Only money the temple actually took can be owed back: on an order still
awaiting payment at the counter, cancelling a date reconciles nothing and
`settlement.method` is `none`. Writing the amount down anyway would leave the
books showing a debt that never existed.

The other dates, the other people and the order itself carry on. The order's
`pooja_status` is rolled up from what is left, so it only reads `cancelled`
once nothing is standing.

**Response `200`** — the detail payload plus:

```json
{
  "status": "confirmed",
  "pooja_status": "pending",
  "payment": {
    "refund_amount": "0.00",
    "reconciled_amount": "751.00",
    "refundable_amount": "751.00"
  },
  "settlement": {
    "method": "reconciliation",
    "amount": "751.00",
    "reference": null,
    "booking_ids": [4182]
  }
}
```

**All or nothing.** One booking that cannot be cancelled — already cancelled,
already performed, or belonging to another order — fails the whole request
with nothing changed. Half a cancellation with no clear record of which half is
worse than an error.

---

## 6. Refunded vs reconciled

Two different things, deliberately kept in two fields:

| Field | Money that… |
|---|---|
| `refund_amount` | the payment gateway was asked to send back. `refund_status` tracks whether it has settled. |
| `reconciled_amount` | was written off the order for a payout made outside the gateway. Nothing settles it automatically — it is a record for the books. |
| `refundable_amount` | is left: `total + additional_charges − refund_amount − reconciled_amount`. |

Both count against `refundable_amount`, so an order cannot be paid back twice.
Cancelling one of two dates on a ₹1,502 order and then cancelling the order
leaves `reconciled_amount: "751.00"`, `refund_amount: "751.00"` and
`refundable_amount: "0.00"`.

---

## 7. The receipt

```
GET /api/admin/orders/pooja/<order_id>/receipt/
```

Works on **both channels**:

* A counter walk-in has a real `CounterReceipt` on file — it is served as it
  was written, `source: "counter"`, with its number, its staff member and its
  payer.
* An app order has none; nothing was printed at a desk. Rather than leave the
  "View receipt" button dead, the receipt is composed from the order, which
  holds the same facts. `source: "derived"`.

A derived receipt is numbered from the order reference — `RCP-PO-2071` — which
keeps it out of the counter's own `RCP-1042` series so the two can never land
on the same number, and makes it read back to the order it belongs to.

```json
{
  "receipt_no": "RCP-PO-2071",
  "source": "derived",
  "issued_at": "2026-07-27T08:15:00Z",
  "order": {
    "id": 2071,
    "reference": "PO-2071",
    "channel": "app",
    "channel_display": "Mobile app",
    "created_at": "2026-07-27T08:15:00Z",
    "agent_code": null
  },
  "payer": { "name": "Jayanth Kumar", "phone_number": "+919888112071", "email": "jayanth.kumar@example.in" },
  "staff_name": null,
  "payment_method": "card",
  "payment_method_display": "Card",
  "payment_status": "paid",
  "items": [
    {
      "pooja_id": 9,
      "name": "Satyanarayana Pooja",
      "god": "Vishnu",
      "base": "751.00",
      "dates": ["2026-07-30"],
      "people": [{ "name": "Jayanth Kumar", "nakshatram": null }],
      "people_count": 1,
      "count": 1,
      "cancelled_count": 0,
      "amount": "751.00",
      "remarks": ""
    }
  ],
  "pooja_count": 1,
  "pooja_count_billed": 1,
  "subtotal": "751.00",
  "additional_charges": "0.00",
  "total": "751.00",
  "refund_amount": "0.00",
  "reconciled_amount": "0.00",
  "net_total": "751.00",
  "cancellation": { "cancelled": false, "reason": null, "cancelled_at": null, "cancelled_by": null, "can_cancel": true, "cancellable_amount": "751.00" }
}
```

`items` is grouped exactly the way the counter prints it, so both kinds of
receipt render through one template. `staff_name` is only ever set on a counter
sale — an app payment went to the gateway, with nobody at a desk.

The figures are **as billed** and stay that way — a cancellation does not
rewrite what was paid:

| Field | |
|---|---|
| `subtotal` + `additional_charges` | = `total`. What the devotee was charged. |
| `total` − `refund_amount` − `reconciled_amount` | = `net_total`. What the temple has kept. |
| `pooja_count` / `pooja_count_billed` | Bookings still standing / bookings the receipt was paid for. Cancelled dates stay in `items`, counted by each item's `cancelled_count`. |

---

## 8. Error responses

| Status | Body | When |
|---|---|---|
| `400` | `{"reason": ["This field may not be blank."]}` | Cancelling an order without a reason. |
| `400` | `{"detail": "This order has already been cancelled."}` | Cancelling twice. |
| `400` | `{"detail": "This booking has already been performed and cannot be cancelled."}` | A performed booking in `booking_ids`. |
| `400` | `{"detail": "Refund already in progress: pending"}` | A refund is in flight; how much has actually gone back is not known yet. |
| `400` | `{"detail": "Razorpay API error: ..."}` | The gateway refused the refund. Nothing was changed. |
| `404` | `{"detail": "Order not found."}` | No such order. |
| `404` | `{"booking_ids": "No booking with id 91 on order PO-2071."}` | A booking id that is not on this order. |
| `403` | `{"detail": "You do not have permission to perform this action."}` | Missing one of the permissions in §1. |
