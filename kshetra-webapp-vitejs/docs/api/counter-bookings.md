# Counter bookings API

`/api/booking/counter/`

The temple counter does two things, and this API covers both.

1. **Walk-in booking** — a devotee comes to the desk, names the people the
   pooja is for, picks poojas and dates, and pays there and then.
2. **Counter payment** — a devotee booked in the app against an agent code
   (payment method `cod`) and settles the bill at the counter later.

> **There is no payment gateway involved.** Money changes hands at the desk, so
> payment is *recorded*, not processed: nothing sits pending waiting for a
> callback, and there is no signature to verify. A walk-in sale is settled the
> moment `POST /counter/sales/` returns `201`.

Every example below is a real response captured from the running API.

---

## Contents

1. [Auth and permissions](#1-auth-and-permissions)
2. [What a booking actually becomes](#2-what-a-booking-actually-becomes)
3. [Catalogue endpoints the counter reads](#3-catalogue-endpoints-the-counter-reads)
4. [Take a walk-in booking](#4-take-a-walk-in-booking)
5. [The day's transactions](#5-the-days-transactions)
6. [One receipt](#6-one-receipt)
7. [Collection summary (KPI band)](#7-collection-summary-kpi-band)
8. [Void a sale](#8-void-a-sale)
9. [Settle an app agent-code booking](#9-settle-an-app-agent-code-booking)
10. [How a counter order looks elsewhere](#10-how-a-counter-order-looks-elsewhere)
11. [Field reference](#11-field-reference)
12. [Error responses](#12-error-responses)

---

## 1. Auth and permissions

Session cookies, same as the rest of the API — see
[`API_PERMISSIONS.md`](../../API_PERMISSIONS.md) §1–3. Send
`credentials: "include"` on every request and the CSRF header on writes.

| Endpoint | Permission required |
|---|---|
| `POST /counter/sales/` | `rbac.operate_counter` **+** `booking.add_poojaorder` |
| `GET /counter/sales/`, `GET /counter/sales/{id}/` | `rbac.operate_counter` |
| `GET /counter/sales/collection-summary/` | `rbac.operate_counter` |
| `POST /counter/sales/{id}/cancel/` | `rbac.cancel_counter_sale` |
| `GET /counter/agent-bookings/` | `rbac.collect_counter_payment` |
| `POST /counter/agent-bookings/{id}/record-payment/` | `rbac.collect_counter_payment` |

They are three separate permissions on purpose: a role can be trusted with the
till without being trusted to reverse it, and voiding a sale reverses money
that has already been taken. `temple_admin` holds all three out of the box.

To let a non-admin role (say `temple_counter_staff`) run the desk, grant it
`rbac.operate_counter`, `rbac.collect_counter_payment`,
`booking.add_poojaorder`, `rbac.access_admin_portal`, and read on the
catalogue models — see [roles-and-permissions.md](roles-and-permissions.md).

---

## 2. What a booking actually becomes

A walk-in sale writes **two** records:

| Record | What it is |
|---|---|
| **`CounterReceipt`** | The money record — receipt number, tender, staff member, total. The printed receipt is generated from this, and the day's collection is summed over it. |
| **`PoojaOrder`** with `channel="counter"` | A perfectly ordinary pooja order. The poojas in it flow into poojari assignment, the admin order screens, exports and refunds exactly like app bookings do. |

**One booking line fans out.** A line is *a pooja + its people + its dates*.
It becomes `people × dates` order lines — one per person per date, which is the
unit a pooja is actually performed in. 2 people × 2 dates = 4 occurrences.
They all carry the same `counter_line_group` so the receipt can be rebuilt the
way the counter entered it.

**Walk-in devotees are not app accounts.** Their name and nakshatram are stored
as a snapshot on the order line (`counter_person_name`,
`counter_person_nakshatram`) and `user_list` stays `null`. Read either channel
through the order line's **`devotee`** field, which resolves both — do not read
`user_list` directly unless you specifically want the saved profile.

**Who owns a counter order.** A walk-in devotee has no account to own the
order, so it is owned by the staff member who rang it up. That is why
`GET /api/booking/orders/` (the devotee's own history) filters to
`channel="app"` — counter sales never leak into a staff member's order list.
The payer's name and phone live on the receipt, not on the user.

---

## 3. Catalogue endpoints the counter reads

Nothing new here — the counter reuses the existing catalogue.

| What | Endpoint |
|---|---|
| Poojas, searchable | `GET /api/booking/poojas/?search=<text>` |
| Poojas for one god | `GET /api/booking/poojas/?god=<id>` |
| Gods | `GET /api/booking/poojacategory/` |
| Nakshatras | `GET /api/user/nakshatrams/` |
| Published dates for a special pooja | `GET /api/booking/special-pooja-dates/` |

**Pricing.** Counter sales are priced at each pooja's **`offline_price`** — the
counter is at the temple. A special pooja whose published date carries its own
`offline_price` uses that instead. The client never sends a price; the server
always computes it.

---

## 4. Take a walk-in booking

```http
POST /api/booking/counter/sales/
Content-Type: application/json
```

```json
{
  "payment_method": "cash",
  "customer_name": "Ramesh Nair",
  "customer_phone": "9876543210",
  "people": [
    { "ref": "P1", "name": "Ramesh", "nakshatram_id": 28 },
    { "ref": "P2", "name": "Lakshmi" }
  ],
  "lines": [
    {
      "pooja_id": 9,
      "person_refs": ["P1", "P2"],
      "dates": ["2026-08-07", "2026-08-08"],
      "remarks": "Morning slot"
    },
    {
      "pooja_id": 10,
      "person_refs": ["P1"],
      "dates": ["2026-08-17"]
    }
  ]
}
```

### Request fields

| Field | Required | Notes |
|---|---|---|
| `payment_method` | yes | `cash`, `card`, `upi`, `netbanking` |
| `customer_name`, `customer_phone` | no | The **payer**, who need not be one of the people |
| `people[].ref` | yes | The counter UI's own row id (`"P1"`). Lines refer to people by it, so the client never invents server ids. Not stored. Must be unique. |
| `people[].name` | yes | Cannot be blank |
| `people[].nakshatram_id` | no | From `/api/user/nakshatrams/` |
| `lines[].pooja_id` | yes | Must be an **active** pooja |
| `lines[].person_refs` | yes | Non-empty, no duplicates, must all exist in `people` |
| `lines[].dates` | yes | Non-empty, no duplicates, `YYYY-MM-DD` |
| `lines[].remarks` | no | Free text, applies to the whole line |

For a **special** pooja, every date must be one the temple has published (an
active `SpecialPoojaDate`). The counter cannot type in an arbitrary one — the
request is rejected instead. A regular pooja takes any date.

A single sale is capped at **500** pooja occurrences.

### `201 Created`

```json
{
  "id": 1,
  "receipt_no": "RCP-1001",
  "sale_type": "walk_in",
  "sale_type_display": "Walk-in booking",
  "staff": 1,
  "staff_name": "counter@temple.test",
  "payment_method": "cash",
  "payment_method_display": "Cash",
  "total": "9500.00",
  "pooja_count": 5,
  "customer_name": "Ramesh Nair",
  "customer_phone": "9876543210",
  "status": "completed",
  "status_display": "Completed",
  "cancel_reason": "",
  "created_at": "2026-08-07T09:27:13.987041+05:30",
  "order_ids": [1],
  "items": [
    {
      "pooja_id": 9,
      "name": "Ganapathy Homam",
      "god": "Ganapathy",
      "base": "500.00",
      "dates": ["2026-08-07", "2026-08-08"],
      "people": [
        { "name": "Ramesh", "nakshatram": "Ashwini" },
        { "name": "Lakshmi", "nakshatram": null }
      ],
      "people_count": 2,
      "count": 4,
      "cancelled_count": 0,
      "amount": "2000.00",
      "remarks": "Morning slot"
    },
    {
      "pooja_id": 10,
      "name": "Udayasthamana Pooja",
      "god": "Ganapathy",
      "base": "7500.00",
      "dates": ["2026-08-17"],
      "people": [{ "name": "Ramesh", "nakshatram": "Ashwini" }],
      "people_count": 1,
      "count": 1,
      "cancelled_count": 0,
      "amount": "7500.00",
      "remarks": ""
    }
  ]
}
```

`(2 × 500) + (1 × 7500) = 9500.00` over `4 + 1 = 5` occurrences. The special
pooja is billed at the published date's `7500.00`, not the pooja's `8000.00`.

**The whole thing is one transaction.** On any validation failure nothing is
written — a `400` never leaves money taken with no pooja recorded against it.

---

## 5. The day's transactions

```http
GET /api/booking/counter/sales/?date=2026-08-07&search=&sale_type=&page=1&page_size=25
```

| Param | Default | Notes |
|---|---|---|
| `date` | today | `YYYY-MM-DD`. Anything else → `400` |
| `search` | — | Matches receipt number, customer name, customer phone |
| `sale_type` | — | `walk_in` or `agent_booking` |
| `page`, `page_size` | 1, 25 | `page_size` max 100 |

Rows are the light shape — **no `items`**. Fetch one receipt for line detail.
Cancelled receipts *are* listed (with `status: "cancelled"`); they are only
excluded from the collection summary.

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "receipt_no": "RCP-1001",
      "sale_type": "walk_in",
      "staff": 1,
      "staff_name": "counter@temple.test",
      "payment_method": "cash",
      "payment_method_display": "Cash",
      "total": "9500.00",
      "pooja_count": 5,
      "customer_name": "Ramesh Nair",
      "customer_phone": "9876543210",
      "status": "completed",
      "created_at": "2026-08-07T09:27:13.987041+05:30"
    }
  ]
}
```

---

## 6. One receipt

```http
GET /api/booking/counter/sales/{id}/
```

Returns the full receipt — identical shape to the `201` in §4, ready to print.
`404` if the id does not exist.

---

## 7. Collection summary (KPI band)

```http
GET /api/booking/counter/sales/collection-summary/?date=2026-08-07
```

```json
{
  "date": "2026-08-07",
  "total_amount": "9500.00",
  "pooja_count": 5,
  "transaction_count": 1,
  "by_method": [
    { "method": "cash",       "method_display": "Cash",        "amount": "9500.00" },
    { "method": "card",       "method_display": "Card",        "amount": "0.00" },
    { "method": "upi",        "method_display": "UPI",         "amount": "0.00" },
    { "method": "netbanking", "method_display": "Net banking", "amount": "0.00" }
  ]
}
```

Every tender is always present, zero included, so the band does not reflow as
the day goes on. **Cancelled receipts are excluded** — that money went back
over the counter. Both walk-in and agent-code receipts count toward the day.

---

## 8. Void a sale

```http
POST /api/booking/counter/sales/{id}/cancel/
{ "reason": "Devotee changed their mind" }
```

`reason` is **required**. Returns the updated receipt (`200`).

Cash taken at the desk is returned at the desk, so this only unwinds the
records — no gateway refund is involved.

| Sale type | What cancelling does |
|---|---|
| `walk_in` | Receipt, its order and every occurrence are marked `cancelled` — both the money (`status`) and the work (`pooja_status`), so the bookings leave the temple's working list too. The sale drops out of the day's takings. |
| `agent_booking` | Only the collection is undone — the receipt detaches from the order. **The app booking itself stands and becomes payable again.** |

Cancelling an already-cancelled receipt is a `400`.

---

## 9. Settle an app agent-code booking

### Find the booking

```http
GET /api/booking/counter/agent-bookings/?search=&paid=&page=1
```

Lists every app booking that reached the counter as an agent-code (`cod`)
order. **Uncollected ones come first.** Cancelled and refunded orders are
excluded — there is nothing left to collect on them.

| Param | Notes |
|---|---|
| `search` | Order id (`41` **or** `KP-41`), agent code, devotee first/last name, email, phone, pooja name |
| `paid` | `true` → collected only; `false` → outstanding only; omit → both |

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "order_id": 2,
      "order_ref": "KP-2",
      "order_group_id": null,
      "devotee": "Ramesh Nair",
      "phone": "9876500000",
      "agent_code": "AGENT-1",
      "pooja_summary": "Ganapathy Homam",
      "pooja_count": 2,
      "first_pooja_date": "2026-08-10",
      "amount": "1200.00",
      "paid": false,
      "payment_method": null,
      "receipt_no": null,
      "status": "confirmed",
      "created_at": "2026-08-07T09:27:14.145556+05:30"
    }
  ]
}
```

`pooja_summary` lists up to two pooja names, then `+N more`. `payment_method`
and `receipt_no` stay `null` until the money is taken.

### Take the money

```http
POST /api/booking/counter/agent-bookings/{order_id}/record-payment/
{ "payment_method": "upi" }
```

`201` returns a receipt with `sale_type: "agent_booking"`:

```json
{
  "id": 2,
  "receipt_no": "RCP-1002",
  "sale_type": "agent_booking",
  "sale_type_display": "Agent-code booking settled at counter",
  "staff": 1,
  "staff_name": "counter@temple.test",
  "payment_method": "upi",
  "payment_method_display": "UPI",
  "total": "1200.00",
  "pooja_count": 2,
  "customer_name": "Ramesh Nair",
  "customer_phone": "9876500000",
  "status": "completed",
  "cancel_reason": "",
  "created_at": "2026-08-07T09:27:14.174737+05:30",
  "order_ids": [2],
  "items": [
    {
      "pooja_id": 9,
      "name": "Ganapathy Homam",
      "god": "Ganapathy",
      "base": "600.00",
      "dates": ["2026-08-10", "2026-08-11"],
      "people": [{ "name": "Ramesh", "nakshatram": "Ashwini" }],
      "people_count": 1,
      "count": 2,
      "cancelled_count": 0,
      "amount": "1200.00",
      "remarks": ""
    }
  ]
}
```

Four things worth knowing:

* **The whole order group is settled by one receipt.** The devotee pays for the
  booking, not for each order row the checkout happened to split it into.
* **The amount comes from the orders, never from the request** — the counter
  cannot under-collect by mistake. There is no `amount` field to send.
* **The order stays `channel: "app"` with `payment_method: "cod"`.** That is
  how it was *placed*. How it was *settled* lives on the receipt and is
  surfaced on the order as `counter_payment_method` and `counter_receipt_no`.
* Collecting twice is a `400`, and so is pointing this at a razorpay order.

---

## 10. How a counter order looks elsewhere

A counter sale is a real `PoojaOrder`, so it shows up in the admin order API
alongside app orders. `GET /api/booking/admin/orders/`:

```json
{
  "order_id": 1,
  "order_status": "confirmed",
  "pooja_status": "pending",
  "users": [
    {
      "order_line_id": 1,
      "user_list": null,
      "user_attribute": null,
      "devotee": { "name": "Ramesh", "nakshatram": "Ashwini" },
      "price": "500.00",
      "line_status": "confirmed"
    }
  ]
}
```

`user_list` and `user_attribute` are `null` on a counter line — **read
`devotee`**, which is populated for both channels.

`PoojaOrderSerializer` (admin order detail, `/api/booking/admin/orders/{id}/`)
gained these fields:

| Field | Meaning |
|---|---|
| `channel` / `channel_display` | `"app"` / `"counter"` |
| `counter_staff` / `counter_staff_details` | Who rang it up |
| `counter_receipt` / `counter_receipt_no` | The receipt, once money is taken |
| `counter_payment_method` | How it was settled at the desk — distinct from `payment_method` |

And on each order line: `devotee` (`{name, nakshatram}`) and `remarks`.

---

## 11. Field reference

### Receipt

| Field | Type | Notes |
|---|---|---|
| `id` | int | Primary key — what `{id}` in the URLs refers to |
| `receipt_no` | string | `RCP-1001`. Derived from `id`, so unique but **may have gaps** where a sale was rolled back |
| `sale_type` | string | `walk_in` \| `agent_booking` |
| `staff` / `staff_name` | int / string | Full name, falling back to email |
| `payment_method` | string | `cash` \| `card` \| `upi` \| `netbanking` |
| `total` | decimal string | `"9500.00"` |
| `pooja_count` | int | Occurrences settled (people × dates) |
| `customer_name` / `customer_phone` | string | The payer. Auto-filled from the account on an agent-code settlement |
| `status` | string | `completed` \| `cancelled` |
| `cancel_reason` | string | Empty unless cancelled |
| `order_ids` | int[] | The `PoojaOrder`(s) this receipt covers |
| `items` | object[] | Detail shape only |

### Receipt item

| Field | Type | Notes |
|---|---|---|
| `base` | decimal string | Price per person, per date |
| `dates` | date[] | Sorted ascending |
| `people` | `{name, nakshatram}[]` | `nakshatram` may be `null` |
| `people_count` | int | |
| `count` | int | `people × dates` — total occurrences |
| `cancelled_count` | int | Occurrences since cancelled |
| `amount` | decimal string | **Authoritative line total; excludes cancelled occurrences.** May be less than `base × count` |
| `remarks` | string | |

> On an `agent_booking` receipt, `items` is rebuilt from the app order's lines,
> which carry no counter grouping — so you get one item per pooja rather than
> per booking line, and `base` is taken from the first line of that pooja.

---

## 12. Error responses

| Status | When |
|---|---|
| `400` | Validation failure — nothing written |
| `403` | Caller lacks the permission (a devotee hitting `/counter/`) |
| `404` | Unknown receipt or booking id |

Field-level validation uses DRF's standard shape:

```json
{ "lines": ["Line 0: unknown person ref(s) ['P9']."] }
```

```json
{ "lines": ["Line 0: 'Udayasthamana Pooja' is a special pooja and is not available on ['2099-01-01']."] }
```

```json
{ "payment_method": ["\"razorpay\" is not a valid choice."] }
```

Business-rule failures use a flat `error` key:

```json
{ "error": "A cancellation reason is required" }
```

```json
{ "error": "This booking has already been paid at the counter", "receipt_no": "RCP-1002" }
```

```json
{ "error": "This order is not an agent-code booking payable at the counter" }
```

```json
{ "error": "date must be in YYYY-MM-DD format" }
```

---

## Testing this API

```bash
# The automated suite for this flow (18 tests)
python manage.py test booking.test_counter_flow

# Confirm no endpoint escaped the permission map
python manage.py rbac_audit
```

See [`booking/test_counter_flow.py`](../../booking/test_counter_flow.py) for
worked examples of every request shape above.
