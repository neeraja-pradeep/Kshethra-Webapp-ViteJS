# Counter Bookings API — Quick Reference

Base path: `/api/booking/counter/`
Auth: session cookies (see `temple-app-auth-permissions-quick-reference.md` §1–2) — `credentials: "include"` + CSRF header on writes.

The counter does two things:
1. **Walk-in booking** — devotee at the desk, pays on the spot.
2. **Counter payment** — devotee already booked in-app on an agent code (`cod`), settles later at the desk.

No payment gateway involved — money is *recorded*, not processed. A sale is settled the moment `POST counter/sales/` returns `201`.

---

## 1. Permissions

| Endpoint | Needs |
|---|---|
| `POST counter/sales/` | `rbac.operate_counter` **+** `booking.add_poojaorder` |
| `GET counter/sales/`, `GET counter/sales/{id}/` | `rbac.operate_counter` |
| `GET counter/sales/collection-summary/` | `rbac.operate_counter` |
| `POST counter/sales/{id}/cancel/` | `rbac.cancel_counter_sale` |
| `GET counter/agent-bookings/` | `rbac.collect_counter_payment` |
| `POST counter/agent-bookings/{id}/record-payment/` | `rbac.collect_counter_payment` |

Three separate permissions on purpose — a role can run the till without being trusted to reverse it. `temple_admin` holds all three by default.

To let a non-admin role run the desk, grant: `rbac.operate_counter`, `rbac.collect_counter_payment`, `booking.add_poojaorder`, `rbac.access_admin_portal`, plus read access on the catalogue models.

---

## 2. What a booking becomes

| Record | What it is |
|---|---|
| `CounterReceipt` | The money record — receipt no., tender, staff, total. Powers the printed receipt and the day's collection total. |
| `PoojaOrder` (`channel="counter"`) | An ordinary pooja order — flows into poojari assignment, admin order screens, exports, refunds exactly like app bookings. |

- **One booking line fans out** to `people × dates` order lines (2 people × 2 dates = 4 occurrences), all sharing a `counter_line_group`.
- **Walk-in devotees aren't app accounts** — name/nakshatram are stored as a snapshot (`counter_person_name`, `counter_person_nakshatram`); `user_list` stays `null`. Always read the **`devotee`** field, which resolves both channels.
- **Ownership:** a counter order is owned by the staff member who rang it up, not the devotee. `GET booking/orders/` (a user's own history) filters to `channel="app"`, so counter sales never leak into it. Payer name/phone live on the receipt.

---

## 3. Catalogue endpoints the counter reads

| What | Endpoint |
|---|---|
| Poojas (searchable) | `GET booking/poojas/?search=<text>` |
| Poojas for one god | `GET booking/poojas/?god=<id>` |
| Gods | `GET booking/poojacategory/` |
| Nakshatras | `GET user/nakshatrams/` |
| Published dates for a special pooja | `GET booking/special-pooja-dates/` |

**Pricing** is always server-computed from `offline_price` (or the published date's own `offline_price` for a special pooja) — the client never sends a price.

---

## 4. Take a walk-in booking

**POST** `counter/sales/`
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
    { "pooja_id": 9, "person_refs": ["P1","P2"], "dates": ["2026-08-07","2026-08-08"], "remarks": "Morning slot" },
    { "pooja_id": 10, "person_refs": ["P1"], "dates": ["2026-08-17"] }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `payment_method` | yes | `cash` \| `card` \| `upi` \| `netbanking` |
| `customer_name`, `customer_phone` | no | The payer — need not be one of the people |
| `people[].ref` | yes | Client-side row id (e.g. `"P1"`); unique, not stored, used to link lines to people |
| `people[].name` | yes | Cannot be blank |
| `people[].nakshatram_id` | no | From `user/nakshatrams/` |
| `lines[].pooja_id` | yes | Must be an **active** pooja |
| `lines[].person_refs` | yes | Non-empty, no duplicates, must exist in `people` |
| `lines[].dates` | yes | Non-empty, no duplicates, `YYYY-MM-DD` |
| `lines[].remarks` | no | Free text, applies to the whole line |

⚠️ For a **special** pooja, every date must be an active published `SpecialPoojaDate` — arbitrary dates are rejected. A regular pooja accepts any date. Cap: **500** occurrences per sale. The whole request is one transaction — a `400` never leaves money taken with nothing recorded.

**Response `201`**
```json
{
  "id": 1, "receipt_no": "RCP-1001", "sale_type": "walk_in",
  "staff": 1, "staff_name": "counter@temple.test",
  "payment_method": "cash", "total": "9500.00", "pooja_count": 5,
  "customer_name": "Ramesh Nair", "customer_phone": "9876543210",
  "status": "completed", "order_ids": [1],
  "items": [ { "pooja_id": 9, "name": "Ganapathy Homam", "base": "500.00",
    "dates": ["2026-08-07","2026-08-08"], "count": 4, "amount": "2000.00" } ]
}
```

---

## 5. List / one receipt / summary

**GET** `counter/sales/?date=2026-08-07&search=&sale_type=&page=1&page_size=25`

| Param | Default | Notes |
|---|---|---|
| `date` | today | `YYYY-MM-DD`; anything else → `400` |
| `search` | — | Receipt no., customer name, or phone |
| `sale_type` | — | `walk_in` \| `agent_booking` |
| `page`, `page_size` | 1, 25 | `page_size` max 100 |

List rows are lightweight (no `items`); cancelled receipts are still listed (`status: "cancelled"`), just excluded from the summary.

**GET** `counter/sales/{id}/` → full receipt, same shape as the `201` above. `404` if unknown.

**GET** `counter/sales/collection-summary/?date=2026-08-07`
```json
{
  "date": "2026-08-07", "total_amount": "9500.00", "pooja_count": 5, "transaction_count": 1,
  "by_method": [
    { "method": "cash", "amount": "9500.00" },
    { "method": "card", "amount": "0.00" },
    { "method": "upi", "amount": "0.00" },
    { "method": "netbanking", "amount": "0.00" }
  ]
}
```
Every tender always appears (zero included) so the KPI band doesn't reflow. Cancelled receipts are excluded; both walk-in and agent-code receipts count.

---

## 6. Void a sale

**POST** `counter/sales/{id}/cancel/`
```json
{ "reason": "Devotee changed their mind" }
```
`reason` is required. Returns the updated receipt (`200`). No gateway refund — cash is returned at the desk, this just unwinds records.

| Sale type | Effect |
|---|---|
| `walk_in` | Receipt, order and every occurrence marked `cancelled`; drops out of the day's takings. |
| `agent_booking` | Only the collection is undone — receipt detaches from the order. **The app booking itself stands and becomes payable again.** |

Cancelling an already-cancelled receipt → `400`.

---

## 7. Settle an app agent-code booking

**GET** `counter/agent-bookings/?search=&paid=&page=1` — every app booking that reached the counter as a `cod` order. Uncollected ones come first; cancelled/refunded orders are excluded.

| Param | Notes |
|---|---|
| `search` | Order id (`41` or `KP-41`), agent code, devotee name, email, phone, pooja name |
| `paid` | `true` = collected only, `false` = outstanding only, omit = both |

**POST** `counter/agent-bookings/{order_id}/record-payment/`
```json
{ "payment_method": "upi" }
```
`201` → receipt with `sale_type: "agent_booking"`.

- **One receipt settles the whole order group** — not per order row.
- **Amount comes from the orders**, never the request — no `amount` field to send, so it can't be under-collected.
- **Order stays `channel: "app"`, `payment_method: "cod"`** — how it was settled shows separately as `counter_payment_method` / `counter_receipt_no`.
- Collecting twice, or hitting a razorpay order → `400`.

---

## 8. How a counter order looks elsewhere

Shows up in `GET booking/admin/orders/` alongside app orders. Read `devotee` on each order line (`user_list`/`user_attribute` are `null` for counter lines).

`PoojaOrderSerializer` (`booking/admin/orders/{id}/`) adds: `channel`/`channel_display`, `counter_staff`/`counter_staff_details`, `counter_receipt`/`counter_receipt_no`, `counter_payment_method`. Each order line also gets `devotee` and `remarks`.

---

## 9. Field reference

**Receipt:** `id`, `receipt_no` (`RCP-1001`, may have gaps), `sale_type` (`walk_in`\|`agent_booking`), `staff`/`staff_name`, `payment_method`, `total`, `pooja_count`, `customer_name`/`customer_phone`, `status` (`completed`\|`cancelled`), `cancel_reason`, `order_ids`, `items`.

**Receipt item:** `base` (price per person per date), `dates` (sorted), `people` (`{name, nakshatram}`), `people_count`, `count` (= people × dates), `cancelled_count`, `amount` (authoritative, excludes cancelled occurrences — may be < `base × count`), `remarks`.

> On an `agent_booking` receipt, `items` is rebuilt from the app order's lines — one item per pooja (not per booking line), `base` taken from that pooja's first line.

---

## Errors

- `400` validation — nothing written, e.g. `{ "lines": ["Line 0: unknown person ref(s) ['P9']."] }`
- `403` caller lacks the permission (e.g. a devotee hitting `/counter/`)
- `404` unknown receipt or booking id
- Business-rule failures use a flat `error` key, e.g. `{ "error": "This booking has already been paid at the counter", "receipt_no": "RCP-1002" }`

---

## Screen → Endpoint cheat sheet

| Screen | Endpoints |
|---|---|
| New walk-in sale | `booking/poojas/`, `booking/poojacategory/`, `user/nakshatrams/`, `booking/special-pooja-dates/`, `counter/sales/` (POST) |
| Day's transactions list | `counter/sales/` (GET) |
| Receipt / print view | `counter/sales/{id}/` |
| KPI band | `counter/sales/collection-summary/` |
| Void sale | `counter/sales/{id}/cancel/` |
| Settle agent-code booking | `counter/agent-bookings/`, `counter/agent-bookings/{id}/record-payment/` |
| Admin order detail (counter fields) | `booking/admin/orders/{id}/` |

Testing: `python manage.py test booking.test_counter_flow` (18 tests); `python manage.py rbac_audit` confirms no endpoint escaped the permission map.
