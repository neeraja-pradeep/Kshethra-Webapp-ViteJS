# Store orders

The shop half of the back office order screen: `/api/admin/orders/product/`.

[order-list.md](order-list.md) covers the feed those orders are listed in;
this covers one order out of it, and everything the back office does to it.
It is the shop's counterpart to [pooja-orders.md](pooja-orders.md), and
deliberately speaks the same shapes — the detail payload, the receipt and the
`settlement` block all read the way the pooja ones do, so one client template
renders either kind of order.

**Contents**

1. [Permissions](#1-permissions)
2. [Endpoints](#2-endpoints)
3. [Taking a walk-in sale](#3-taking-a-walk-in-sale)
4. [The fulfilment flow](#4-the-fulfilment-flow)
5. [Cancelling](#5-cancelling)
6. [Refunding](#6-refunding)
7. [Receipts](#7-receipts)
8. [How payment works](#8-how-payment-works)
9. [Field reference](#9-field-reference)
10. [Error responses](#10-error-responses)

---

## 1. Permissions

Every endpoint here requires **`rbac.access_all_objects`** on top of its own
model permissions. That is what keeps devotees out and is not a formality: these
are back office screens that act on an order named in the URL and do no
ownership check of their own, because acting on somebody else's order is the
entire job. A devotee holds `e_commerce.view_order` and `add_order` for their
own records, so without `access_all_objects` they could read — or on the walk-in
endpoint write — anybody's.

| Endpoint | Also requires |
|---|---|
| `GET …/<id>/` | `e_commerce.view_order`, `e_commerce.view_orderline` |
| `GET …/<id>/receipt/` | `e_commerce.view_order` |
| `POST …/walk-in/` | `e_commerce.add_order`, `e_commerce.add_orderline`, `e_commerce.change_stock` |
| `POST …/<id>/fulfilment/` | `e_commerce.change_order` |
| `POST …/<id>/cancel/` | `rbac.refund_ecommerce_order`, `e_commerce.change_order`, `e_commerce.change_stock` |
| `POST …/<id>/refund/` | `rbac.refund_ecommerce_order`, `e_commerce.change_order` |

**Temple Admin**, **Manager** and **Store Staff** hold all of the above.
**Reports Manager** can read an order and its receipt but not act on one.
Counter Staff hold none of it: the pooja counter's `operate_counter` is
deliberately separate, and selling a mala at the desk is the shop's job rather
than the pooja counter's. If you
want one desk doing both, add the shop model permissions to Counter Staff —
that is a role decision, not a code change.

---

## 2. Endpoints

| Method | Path | Does |
|---|---|---|
| `POST` | `/api/admin/orders/product/walk-in/` | Take a walk-in sale at the counter |
| `GET` | `/api/admin/orders/product/<id>/` | One order in full |
| `POST` | `/api/admin/orders/product/<id>/fulfilment/` | Move it along the fulfilment flow |
| `POST` | `/api/admin/orders/product/<id>/cancel/` | Call it off and settle the money |
| `POST` | `/api/admin/orders/product/<id>/refund/` | Send money back without cancelling |
| `GET` | `/api/admin/orders/product/<id>/receipt/` | The receipt, on either channel |

Every endpoint except the receipt returns the **whole order detail payload**, so
a screen never has to re-fetch after acting. Cancel and refund add a
`settlement` block on top of it; cancel also adds `restocked`.

---

## 3. Taking a walk-in sale

`POST /api/admin/orders/product/walk-in/` — the *New walk-in order* button.

```json
{
  "customer_name": "Anjali Menon",
  "customer_phone": "9847011234",
  "payment_method": "cash",
  "items": [
    { "product_variant": 12, "quantity": 3 },
    { "product_variant": 18, "quantity": 1 }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `customer_name`, `customer_phone` | no | A sale to somebody who does not give a name is still a sale. |
| `payment_method` | **yes** | `cash`, `card`, `upi` or `netbanking`. Not `razorpay` or `cod` — see §8. |
| `items[]` | **yes** | `{product_variant, quantity}`. One line per variant; listing the same variant twice is a `400`, combine the quantities. |

The whole thing is **one transaction**: the order, its lines and the stock
coming off the shelf all land together or none of them do. A half-written sale
would mean money in the drawer with no record of what was sold.

The order comes back **`delivered`** and **`paid`**, with a receipt number
stamped on it. That is not optimism — a counter sale *is* the handover: the
buyer pays and walks out with the goods, so there is no fulfilment left to do
and nothing to collect later.

**Stock** is checked against what is actually sellable, with live app
reservations counted out, so the counter cannot sell the last box out from under
a devotee who is mid-payment for it. Every row is locked before any is checked,
so two tills cannot both pass and then both write. Not enough stock is a `400`
naming each shortfall, with nothing written:

```json
{
  "detail": "Not enough stock to complete this sale.",
  "items": [
    { "product_variant": 18, "name": "Large", "requested": 9, "available": 5 }
  ]
}
```

The order is owned by the staff member who rang it up — a walk-in buyer has no
account — and `channel`, `counter_staff` and the `customer_*` snapshot are what
tell it apart from that person's own app orders. In the feed and in the detail
payload, `customer` reports the **buyer**, not the staff member.

---

## 4. The fulfilment flow

`POST /api/admin/orders/product/<id>/fulfilment/` with `{"status": "packed"}`.

```
pending → confirmed → processing → packed → shipped → delivered
    ↓          ↓            ↓          ↓         ↓
                    cancelled                        (delivered is terminal)
```

One step at a time. Sending a status that does not follow the current one is
refused **with the list of what does**, rather than written — an order that
could be marked delivered straight from processing would let a parcel be
recorded as handed over without ever having been packed:

```json
{
  "detail": "An order that is processing cannot be marked delivered.",
  "next_statuses": ["packed", "cancelled"]
}
```

You never have to encode the flow client-side: every detail payload reports
`fulfilment.next_statuses`, which is read from the same table the endpoint
checks against. Enable buttons from it.

`delivered` is terminal on purpose — an order already in the customer's hands is
put right with a **refund**, not by cancelling a fulfilment that demonstrably
happened.

`cancelled` is in the flow but is **not accepted here**: it moves money, so the
request is pointed at the cancel endpoint, which takes a reason and settles the
refund.

Marking a **COD** order `delivered` also sets `payment_status: "paid"` —
collecting on delivery is the whole arrangement, so the handover is what records
the money as taken.

---

## 5. Cancelling

`POST /api/admin/orders/product/<id>/cancel/` with `{"reason": "Out of stock"}`.
A reason is **required** — a cancellation nobody can account for later is what
the field exists to prevent.

The money is settled the one way that fits how it was taken, and **before** the
cancellation is written, so a refund the provider refuses leaves the order
exactly as it was rather than cancelled with no money behind it:

| The order | What happens |
|---|---|
| Paid (gateway) | Refunded through the gateway. `settlement.method: "gateway"`. |
| Paid (counter, COD collected) | Refunded immediately. `settlement.method: "counter"`. |
| Never collected | Nothing owed. `settlement.method: "none"`. |

**Stock** goes back for anything that had not shipped, reported as
`restocked: true`. Once a parcel is with the courier the goods are not on the
shelf, and writing them back would have the shop sell what it does not have.

---

## 6. Refunding

`POST /api/admin/orders/product/<id>/refund/` — sends money back **without**
calling the order off, for a damaged item off an order that was otherwise
delivered fine.

```json
{ "amount": "120.00", "reason": "Damaged diya" }
```

Omit `amount` to send back the whole remainder.

Refunds **accumulate**. The cap is what is *left* to give back
(`payment.refundable_amount`), not the order total — two half refunds are
allowed, three are not. An order with some of its money still with the temple
reads `partially_refunded` in the feed; once everything is back it reads
`refunded`. That is how the two are told apart on screen.

An order that never collected anything is a `400`: there is nothing to send
back.

---

## 7. Receipts

`GET /api/admin/orders/product/<id>/receipt/` works for **either** channel.

A walk-in has a number stamped on it (`SRCP-1042`) and is served as written,
with the staff member who took the money. An app order has none — nothing is
printed at a desk for it — so rather than leaving the button dead, the receipt
is composed from the order, which holds the same facts, and numbered from the
order reference (`RCP-SO-4021`). Its own series, which is what keeps it from
colliding with the counter's.

`source` says which you got: `counter` or `derived`.

`subtotal` is the goods; `total` is what was charged, which on an app order
includes the delivery fee added at checkout. `net_total` is what the temple
kept — charged, less everything sent back.

---

## 8. How payment works

**There is no payment gateway in the walk-in path.** The money is handed over at
the desk, so payment is *recorded* rather than processed — the same way the
pooja counter has always worked. That is why `payment_method` there is a tender
type (`cash`, `card`, `upi`, `netbanking`) rather than `razorpay`.

Refunds go through one place, `e_commerce.payments`, which picks the provider:

| The order | Provider | Settles |
|---|---|---|
| Has a `razorpay_payment_id`, and credentials are configured | Razorpay | `refund_status: "pending"` — the gateway confirms asynchronously. |
| Anything else | Dummy | `refund_status: "processed"` immediately, reference `DUMMYRFND-…`. |

That difference is the point. The dummy is not only a development stand-in: a
counter sale genuinely has no gateway, so "recorded, not processed" is the real
behaviour for that channel. And because it settles on the spot, `refunded` and
`partially_refunded` are states an order actually reaches rather than ones it is
only ever on its way to.

---

## 9. Field reference

### Detail payload

| Field | Type | Notes |
|---|---|---|
| `source` | string | Always `product`. |
| `id`, `reference` | int, string | `SO-<id>` is what the admin sees. |
| `channel`, `channel_display` | string | `app` or `counter`. |
| `status` | string | The stored fulfilment status. |
| `customer` | object | `{id, name, email, phone_number}`. On a walk-in, the buyer, with `id: null`. |
| `counter` | object \| null | Present only on a walk-in — see [order-list.md §9](order-list.md#9-field-reference). |
| `shipping_address`, `billing_address` | object \| null | `null` on a counter sale — nothing is delivered. |
| `item_count` | int | Units bought. |
| `distinct_item_count` | int | How many different variants. |
| `items[]` | array | See below. |
| `payment` | object | See below. |
| `fulfilment` | object | `{status, status_display, next_statuses, can_cancel}`. |
| `cancellation` | object | `{cancelled, reason, cancelled_at, cancelled_by, can_cancel, cancellable_amount}`. |

### `items[]`

`{id, variant_id, sku, name, product_name, variant_name, category, image_url,
quantity, unit_price, amount}`.

`name` is `"<product> - <variant>"`, because variants are what is actually sold
(size, weight) and two lines would otherwise look identical.

### `payment`

| Field | Notes |
|---|---|
| `total` | What was charged. |
| `payment_status` | Derived — `paid`, `pending`, `failed`, `cancelled`, `refund_pending`, `refunded`, `partially_refunded`. |
| `payment_method`, `payment_method_display` | |
| `refund_status` | `none`, `pending`, `processed`, `failed`. |
| `refund_amount` | What has gone back, accumulated across refunds. |
| `refund_reference` | The provider's reference for the last refund. |
| `refundable_amount` | What is left to send back. Caps the next refund. |
| `receipt` | `{receipt_no, source}` — see §7. |

### `settlement` (cancel and refund only)

`{method, amount, reference}` where `method` is `gateway`, `counter` or `none`.

---

## 10. Error responses

| Request | Response |
|---|---|
| Unknown order | `404 {"detail": "Order not found."}` |
| Cancel with no reason | `400 {"reason": ["This field is required."]}` |
| Fulfilment step out of order | `400 {"detail": "…", "next_statuses": [...]}` |
| `{"status": "cancelled"}` to fulfilment | `400` pointing at the cancel endpoint |
| Cancelling twice | `400 {"detail": "This order has already been cancelled."}` |
| Refunding more than is left | `400 {"detail": "Only 380.00 is left to refund on this order"}` |
| Refunding an uncollected order | `400 {"detail": "Nothing has been collected…"}` |
| Walk-in with too little stock | `400` with a per-line `items` breakdown — see §3 |
| Walk-in naming an unknown variant | `404 {"items": "No product variant with id 999."}` |

| Status | When |
|---|---|
| `401` | Not signed in. |
| `403` | Signed in without the permissions in §1. |
