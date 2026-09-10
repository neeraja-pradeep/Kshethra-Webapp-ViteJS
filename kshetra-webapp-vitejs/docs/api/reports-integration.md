# Reports API — frontend integration reference

Every report the Reports screen can show, in one place: **12 reports across 6
groups**, all answering on the same three endpoints.

There is no per-report URL shape to learn — only the `<slug>` changes:

```http
GET /api/report/catalogue/          the card grid, and every report's metadata
GET /api/report/<slug>/             the table
GET /api/report/<slug>/export/      the download
GET /api/report/options/<source>/   a filter dropdown's contents
```

| Group | Slug | Report | One row is |
|---|---|---|---|
| Poojas | [`poojas`](#21-poojas--pooja-report) | Pooja Report | one pooja in the catalogue |
| Orders | [`pooja-orders`](#22-pooja-orders--pooja-orders-report) | Pooja Orders Report | one order — one payment |
| Orders | [`refunds`](#23-refunds--refund-report) | Refund Report | one order money was given back on |
| Bookings | [`pooja-bookings`](#24-pooja-bookings--pooja-bookings-report) | Pooja Bookings Report | one pooja, one person, one date |
| Bookings | [`cancellations`](#25-cancellations--cancellation-report) | Cancellation Report | one cancelled booking |
| Counter | [`counter-bookings`](#26-counter-bookings--counter-bookings-report) | Counter Bookings Report | one transaction at the desk |
| Counter | [`agent-codes`](#27-agent-codes--agent-code-usage-report) | Agent Code Usage Report | one agent code |
| Staff | [`poojari`](#28-poojari--poojari-report) | Poojari Report | one poojari |
| Staff | [`poojari-incentive`](#29-poojari-incentive--poojari-incentive-report) | Poojari Incentive Report | one performed booking |
| Staff | [`attendance`](#210-attendance--attendance-report) | Attendance Report | one poojari |
| Staff | [`admin-users`](#211-admin-users--admin-report) | Admin Report | one staff account |
| Inventory | [`inventory`](#212-inventory--inventory-report) | Inventory Report | one stock line |

Every example below is a **real captured response**, not a sketch.

> **Nothing here is hardcoded in the frontend.** Columns, filters, their
> dropdown options, each card's icon, the period presets and the page-size cap
> all arrive from `/api/report/catalogue/`. Render the grid and every table from
> that, so adding a report server-side needs no frontend release.

For the reasoning behind each report — why a figure is counted the way it is —
see [`reports.md`](reports.md). This file is the integration contract.

---

## Contents

1. [Common to every report](#1-common-to-every-report)
   - [Headers](#headers) · [Permissions](#permissions) · [Shared query params](#shared-query-params) · [Response envelope](#response-envelope) · [Catalogue](#catalogue) · [Filter option sources](#filter-option-sources)
2. [The reports](#2-the-reports)
3. [Export](#3-export)
4. [Error responses](#4-error-responses)
5. [Pagination](#5-pagination)

---

## 1. Common to every report

### Headers

| Header | Value | Notes |
|---|---|---|
| `Cookie` | `sessionid=…` | Session auth. Send `credentials: "include"`. |
| `Content-Type` | — | Not needed; every endpoint here is a `GET`. |
| `X-CSRFToken` | — | Not needed. CSRF applies to unsafe methods only. |

### Permissions

Two gates, both enforced.

**The screen**, from the permission map:

| Endpoint | Requires |
|---|---|
| `GET /api/report/catalogue/` | `rbac.view_reports` |
| `GET /api/report/<slug>/` | `rbac.view_reports` |
| `GET /api/report/options/<source>/` | `rbac.view_reports` |
| `GET /api/report/<slug>/export/` | `rbac.view_reports` **+** `rbac.export_reports` |

**The report** — each additionally requires what it reads:

| Slug | Also requires |
|---|---|
| `poojas` | `booking.view_pooja` |
| `pooja-orders` | `rbac.manage_pooja_orders` + `booking.view_poojaorder` |
| `refunds` | `rbac.manage_pooja_orders` + `booking.view_poojaorder` |
| `pooja-bookings` | `rbac.manage_pooja_orders` + `booking.view_poojaorderline` |
| `cancellations` | `rbac.manage_pooja_orders` + `booking.view_poojaorderline` |
| `counter-bookings` | `booking.view_counterreceipt` |
| `agent-codes` | `booking.view_agentcode` |
| `poojari` | `rbac.manage_poojaris` + `temple_poojari.view_poojariprofile` |
| `poojari-incentive` | `rbac.manage_poojaris` + `booking.view_poojaorderline` |
| `attendance` | `rbac.view_poojari_attendance` + `temple_poojari.view_poojariattendance` |
| `admin-users` | `rbac.manage_users` + `authentication.view_customuser` |
| `inventory` | `e_commerce.view_productvariant` |

Verified live across all eight roles:

| Role | Reports screen |
|---|---|
| `temple_admin`, `manager`, `reports_manager` | ✅ `200` |
| `app_manager`, `counter_staff`, `store_staff`, `temple_poojari`, `temple_user` | ❌ `403` |
| anonymous | ❌ `403` |

`reports_manager` can read **and** export (it holds `export_reports`);
`store_staff` gets `403` on both.

**The catalogue never lists a report that would `403` when clicked** — verified
across every role, zero mismatches. Render what the catalogue returns without
re-checking permissions client-side. Each entry also carries a `permitted`
boolean if you want to grey a card rather than hide it.

### Shared query params

Accepted by every `<slug>` and its `export/`:

| Param | Type | Default | Notes |
|---|---|---|---|
| `period` | enum | `this_month` (`all_time` for `admin-users`) | See presets below |
| `date_from` / `date_to` | `YYYY-MM-DD` | — | With `period=custom`. Either alone is allowed. |
| `sort` | string | per report | A column key, optionally `-` prefixed |
| `page` | int | `1` | Rows endpoint only |
| `page_size` | int | `20` | Max `200`. Rows endpoint only |

**Period presets** (from `catalogue.periods`):

```
today · yesterday · last_7_days · last_30_days · this_month
last_month · this_quarter · this_year · all_time · custom
```

Each report says *which date* the period narrows, in `period_field` — a booking
is reported on the date its pooja falls, an order on the date it was placed.
Show it, so an admin knows what the window is *of*.

**Every column of every report sorts, in both directions** — the one exception
is a `list` column (a pooja's gods, a user's roles), where there is no single
value to order by. Verified: 170 sort combinations across the six newest
reports, 0 failures.

### Response envelope

Identical for all 12. Real capture (`refunds`, `page_size=1`):

```json
{
  "report": {
    "slug": "refunds",
    "label": "Refund Report",
    "description": "Pooja orders the temple gave money back on — through the gateway or written off at the desk — and why.",
    "columns": [
      {
        "key": "order_total",
        "label": "Order value",
        "type": "money",
        "align": "right",
        "sortable": true,
        "total": true,
        "help_text": "Total plus any additional charges."
      }
    ]
  },
  "count": 4,
  "page": 1,
  "page_size": 1,
  "total_pages": 4,
  "has_next": true,
  "has_previous": false,
  "period": { "period": "all_time", "date_from": null, "date_to": null },
  "sort": "-created_at",
  "filters_applied": {},
  "rows": [ { "…": "one object per row, keyed by column key" } ],
  "totals": { "order_total": "3300.00", "…": "…", "rows": 4 }
}
```

| Field | Meaning |
|---|---|
| `report.columns[]` | `key`, `label`, `type`, `align`, `sortable`, `total`, `help_text` |
| `count` | Rows matching the filters — the whole set, not this page |
| `period` | The window that was actually resolved, echoed back |
| `sort` | The sort actually applied |
| `filters_applied` | Only the filters that were honoured |
| `rows[]` | One object per row, keyed by column key |
| `totals` | A figure for each `total: true` column, plus `rows` on every report |

**Column types drive rendering:** `money` and `number` right-align, `boolean`
centres, `status` renders as a chip, `list` holds several values, `date` and
`datetime` are ISO strings.

**Money is a string** — deliberately, so no decimal is lost to a float in
transit. Parse with a decimal library, not `parseFloat`.

`totals` is over the **whole filtered set, never the page**.

### Catalogue

`GET /api/report/catalogue/` → `200`

```json
{
  "groups": [
    { "key": "poojas",    "label": "Poojas",    "reports": ["poojas"] },
    { "key": "orders",    "label": "Orders",    "reports": ["pooja-orders", "refunds"] },
    { "key": "bookings",  "label": "Bookings",  "reports": ["pooja-bookings", "cancellations"] },
    { "key": "counter",   "label": "Counter",   "reports": ["counter-bookings", "agent-codes"] },
    { "key": "staff",     "label": "Staff",     "reports": ["poojari", "poojari-incentive", "attendance", "admin-users"] },
    { "key": "inventory", "label": "Inventory", "reports": ["inventory"] }
  ],
  "reports": [ { "slug": "…", "label": "…", "…": "…" } ],
  "periods": [ { "value": "this_month", "label": "This month" } ],
  "page_size": { "default": 20, "max": 200 },
  "export_formats": ["csv", "xlsx"]
}
```

`groups[].reports` holds slugs in render order; look each up in `reports[]`.
Every entry carries:

```
slug · label · description · group · group_label · icon · permitted
has_period · period_field · default_period · default_sort
columns[] · filters[] · exports[]
```

`icon` is a [Lucide](https://lucide.dev) name, served rather than hardcoded so
a new report's card needs no frontend release.

### Filter option sources

A filter arrives either with its `options` embedded (short fixed lists) or with
an `options_source` naming a lookup to fetch:

```http
GET /api/report/options/<source>/?search=<text>&limit=<n>
```

Sources in use: `gods`, `poojas`, `poojaris`, `counter_staff`, `agent_codes`,
`base_roles`, `custom_roles`. Use `search` for a type-ahead rather than pulling
the whole list.

---

## 2. The reports

Each section below gives the report's purpose, its own filters, and a real row.
Headers, shared params, the envelope, errors and pagination are as in §1 for
every one of them.

---

### 2.1 `poojas` — Pooja Report

**Purpose** — Every pooja in the catalogue, with what it was booked, performed
and earned over the period. The catalogue's performance, not a booking list.

**Paths** — `GET /api/report/poojas/` · `GET /api/report/poojas/export/`

**Period** over `pooja_date` · **default sort** `-booked` · 12 columns

**Own filters**

| Param | Values |
|---|---|
| `special_pooja` | `true`, `false` |
| `god` | category id (source `gods`) |
| `status` | `true` (active), `false` |
| `has_incentive` | boolean |
| `search` | pooja name (Malayalam and Manglish) |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 1, "pooja": "ഗണപതി ഹോമം", "gods": ["ഗണപതി"],
      "pooja_type": "Regular pooja", "status": "Active",
      "online_price": "351.00", "offline_price": "351.00", "incentive": "150.00",
      "booked": 12, "completed": 3, "cancelled": 0, "revenue": "4212.00"
    }
  ],
  "totals": { "booked": 33, "completed": 8, "cancelled": 0, "revenue": "16683.00", "rows": 13 }
}
```

`incentive` here is the pooja's **rate**; `revenue` is what its bookings earned
the temple. `gods` is a `list` column — the only kind that does not sort.

---

### 2.2 `pooja-orders` — Pooja Orders Report

**Purpose** — Every pooja order, app and counter, with what it was billed, what
was refunded and what the temple kept. One row is one order — one payment.

`poojari` is a **`list`** column, not `text`: an order can carry several
bookings assigned to different poojaris, so the cell is an array of names —
`[]` until somebody is assigned. Like every `list` column it is not sortable.

**Paths** — `GET /api/report/pooja-orders/` · `…/export/`

**Period** over `created_at` · **default sort** `-created_at` · 18 columns

**Own filters** (11)

| Param | Values |
|---|---|
| `channel` | `app`, `counter` |
| `payment_status` | `pending`, `confirmed`, `completed`, `cancelled`, `refunded` |
| `settlement` | `paid`, `pending`, `awaiting_counter_payment`, `failed`, `cancelled`, `refund_pending`, `refunded` |
| `pooja_status` | `pending`, `completed`, `cancelled` |
| `payment_mode` | `online`, `offline` |
| `god` · `pooja` · `poojari` · `agent_code` | ids (sources `gods`, `poojas`, `poojaris`, `agent_codes`) |
| `is_special_pooja` | `true`, `false` |
| `search` | customer name, phone, reference, receipt no |

**Success — `200`**

```json
{
  "rows": [
    {
      "reference": "PO-33",
      "created_at": "2026-09-08T07:34:19.848610Z",
      "customer": "Devotee Seed", "phone_number": null,
      "channel": "Mobile app", "order_status": "Confirmed",
      "payment_status": "paid", "payment_method": "Razorpay",
      "pooja_status": "Completed",
      "poojari": ["Krishnan Namboothiri"],
      "agent_code": null, "receipt_no": null,
      "bookings": 1,
      "total": "501.00", "additional_charges": "0.00",
      "refund_amount": "0.00", "reconciled_amount": "0.00", "net": "501.00"
    }
  ],
  "totals": {
    "bookings": 33, "total": "16683.00", "additional_charges": "0.00",
    "refund_amount": "0.00", "reconciled_amount": "0.00",
    "net": "16683.00", "rows": 33
  }
}
```

`net` = `total + additional_charges − refund_amount − reconciled_amount` — what
the temple actually kept.

`order_status` and `payment_status` are different questions: the first is the
order's own state, the second is where its money is.

---

### 2.3 `refunds` — Refund Report

**Purpose** — Pooja orders the temple gave money back on, and why.

**Paths** — `GET /api/report/refunds/` · `…/export/`

**Period** over `created_at` · **default sort** `-created_at` · 16 columns

**Own filters**

| Param | Values | Meaning |
|---|---|---|
| `refund_status` | `none`, `pending`, `processed`, `failed` | |
| `route` | `gateway`, `reconciled`, `both` | How the money went back |
| `extent` | `full`, `partial` | Whole order, or part |
| `channel` | `app`, `counter` | |
| `search` | free text | Payer name, phone or reason |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 43,
      "created_at": "2026-09-08T06:48:58.977226Z",
      "payer": "Devotee Seed", "phone": null,
      "channel": "Mobile app", "payment_method": "Razorpay",
      "status": "Cancelled", "refund_status": "Refund Processed",
      "order_total": "900.00",
      "refund_amount": "900.00", "reconciled_amount": "0.00",
      "given_back": "900.00", "kept": "0.00",
      "refund_reason": null,
      "cancel_reason": "Temple closed for maintenance",
      "cancelled_at": "2026-09-08T06:48:58.434239Z"
    }
  ],
  "totals": {
    "order_total": "3300.00", "refund_amount": "2100.00",
    "reconciled_amount": "400.00", "given_back": "2500.00",
    "kept": "800.00", "rows": 4
  }
}
```

**Two money-back figures, deliberately apart:**

- `refund_amount` — sent back the way it came, through the gateway.
- `reconciled_amount` — written off **without** the gateway: a booking
  cancelled on a counter sale, a COD order, a date pulled off a paid order.

`given_back` is their sum. They are stored apart so the books can tell them
apart — don't blend them into one figure.

**A row appears when the order gave anything back — not when `refund_status`
says so.** A reconciled write-off never touches that field, so a row can read
`refund_status: "No Refund"` and still carry a `reconciled_amount`.

**Scope: pooja orders only.** The shop's refunds have a different settlement
story and their own export at `POST /api/report/export/ecommerce-orders/`.

---

### 2.4 `pooja-bookings` — Pooja Bookings Report

**Purpose** — One row per pooja, per person, per date: who it is for, who
performs it, and whether it was done. The finest grain the temple works at.

**Paths** — `GET /api/report/pooja-bookings/` · `…/export/`

**Period** over `pooja_date` · **default sort** `-pooja_date` · 22 columns

**Own filters** (8)

| Param | Values |
|---|---|
| `god` · `pooja` · `poojari` | ids (sources `gods`, `poojas`, `poojaris`) |
| `pooja_type` | `special`, `regular` |
| `channel` | `app`, `counter` |
| `status` | `pending`, `completed`, `cancelled` (the work) |
| `line_status` | `confirmed`, `cancelled`, `refunded` (the money) |
| `search` | pooja, person, poojari or booker name |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 25, "order_reference": "PO-25",
      "pooja": "ഭഗവതി സേവ", "gods": ["ദേവി"],
      "pooja_type": "Regular pooja",
      "pooja_date": "2026-09-22", "pooja_time": null,
      "person": "രാമചന്ദ്രൻ", "nakshatram": "തിരുവാതിര",
      "booked_by": "Devotee Seed", "channel": "Mobile app",
      "poojari": "Sharma Sastrigal",
      "pooja_status": "Pending", "line_status": "Confirmed",
      "assigned_at": null, "complete_by": null, "is_overdue": false,
      "completed_at": null, "cancel_reason": null,
      "price": "501.00", "incentive": "175.00",
      "created_at": "2026-09-08T07:34:19.740302Z"
    }
  ],
  "totals": { "price": "16683.00", "incentive": "6075.00", "rows": 33 }
}
```

`pooja_status` is the **work**, `line_status` is the **money**. `is_overdue` means the 24h completion window its assignment opened
has lapsed while the booking is still pending.

---

### 2.5 `cancellations` — Cancellation Report

**Purpose** — One row per cancelled booking: the pooja, when it was called off,
by whom, why, and what was given back.

**Paths** — `GET /api/report/cancellations/` · `…/export/`

**Period** over `pooja_date` · **default sort** `-cancelled_at` · 14 columns

**Own filters**

| Param | Values | Meaning |
|---|---|---|
| `kind` | `booking`, `work`, `both` | Which sense of cancelled |
| `refunded` | `yes`, `no` | Something given back, or nothing |
| `god` · `pooja` | ids | |
| `search` | free text | Pooja, devotee name or reason |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 41, "order_id": 44, "pooja_date": "2026-09-08",
      "pooja": "ഗണപതി ഹോമം", "gods": ["ഗണപതി"], "devotee": "Ramesh",
      "channel": "Mobile app",
      "status": "Cancelled", "pooja_status": "Cancelled",
      "cancelled_at": "2026-09-08T06:48:58Z",
      "cancelled_by": "rpt_admin",
      "cancel_reason": "Order cancelled",
      "price": "300.00", "order_refunded": "900.00"
    }
  ],
  "totals": { "price": "1200.00", "rows": 4 }
}
```

**One row per booking, not per order** — one date can be pulled off a family's
standing order while the rest goes ahead.

**Two fields say "cancelled" and they are different questions:** `status`
is the money (no longer owed), `pooja_status` is the work (will not be
performed). A row appears if **either** is set; `kind` separates them.

**`order_refunded` is per order, not per booking** — one order can hold several
cancellations, so **do not sum this column across rows**. It is deliberately
absent from `totals` for that reason.

`cancelled_by` is blank when the devotee cancelled it themselves.

---

### 2.6 `counter-bookings` — Counter Bookings Report

**Purpose** — Every transaction taken at the counter — walk-in bookings and
agent-code collections — by staff member and tender.

**Paths** — `GET /api/report/counter-bookings/` · `…/export/`

**Period** over `created_at` · **default sort** `-created_at` · 13 columns

**Own filters**

| Param | Values |
|---|---|
| `sale_type` | `walk_in`, `agent_booking` |
| `payment_method` | `cash`, `card`, `upi`, `netbanking` |
| `staff` | user id (source `counter_staff`) |
| `status` | `completed`, `cancelled` |
| `search` | receipt number, customer name or phone |

**Success — `200`**

```json
{
  "rows": [
    {
      "receipt_no": "RCP-1001",
      "created_at": "2026-09-08T07:35:07.697126Z",
      "staff": "doc_admin",
      "sale_type": "Walk-in booking", "payment_method": "Cash",
      "customer_name": "Ramesh Pillai", "customer_phone": "9876511111",
      "orders": 0, "pooja_count": 3,
      "status": "Completed", "cancel_reason": null,
      "total": "1200.00", "collected": "1200.00"
    }
  ],
  "totals": { "orders": 0, "pooja_count": 3, "total": "1200.00", "collected": "1200.00", "rows": 1 }
}
```

`total` is what the receipt was written for, voided or not; `collected` is what
the temple kept — **zero on a voided sale**. `pooja_count` is occurrences
settled by the receipt (people × dates).

---

### 2.7 `agent-codes` — Agent Code Usage Report

**Purpose** — One row per agent code: bookings placed under it, what they were
worth, and how much has been collected. A reconciliation report — an agent code
exists to defer payment to the desk.

**Paths** — `GET /api/report/agent-codes/` · `…/export/`

**Period** over the booking's `created_at` · **default sort** `-uses` · 15 columns

**Own filters**

| Param | Values | Meaning |
|---|---|---|
| `status` | `active`, `inactive`, `expired` | The admin's switch |
| `validity` | `active`, `scheduled`, `expired` | Where it sits in its window |
| `usage` | `used`, `unused`, `exhausted` | In the period / not / hit its limit |
| `search` | free text | Code name or purpose |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 1, "name": "FESTIVAL25", "purpose": "Onam desk",
      "status": "Active", "validity_state": "Active now",
      "valid_from": null, "valid_to": null,
      "usage_limit": 10, "uses": 3, "uses_all_time": 3, "remaining": 7,
      "booked": "1500.00", "collected": "1500.00", "outstanding": "0.00",
      "created_at": "2026-09-08T06:48:58Z"
    }
  ],
  "totals": { "uses": 5, "booked": "2500.00", "collected": "1500.00", "outstanding": "1000.00", "rows": 3 }
}
```

**`status` and `validity_state` are two different questions** — the admin's
switch versus the clock. A code can be switched on and out of season, or off
mid-festival.

**A cancelled order is not a use** — same rule as the Agent code screen.

**`uses` is period-narrowed; `uses_all_time` and `remaining` are not** — a
limit is counted against the code's whole life. `remaining` is `null` when
there is no limit.

`outstanding` = `booked − collected`, the balance still to settle at the desk.

---

### 2.8 `poojari` — Poojari Report

**Purpose** — One row per poojari: what was assigned to them, what they
performed, and what they are owed for it.

**Paths** — `GET /api/report/poojari/` · `…/export/`

**Period** over `pooja_date` · **default sort** `-completed` · 16 columns

**Own filters**

| Param | Values |
|---|---|
| `profile_status` | `active`, `inactive`, `pending`, `verified` |
| `is_activated` | `true`, `false` (registered but never signed in) |
| `god` · `pooja` | ids |
| `has_work` | `true`, `false` (had bookings in the period) |
| `search` | name, phone or employee ID |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 1, "poojari": "Sharma Sastrigal", "employee_id": "P-SEED-001",
      "phone_number": null, "email": "seed_sharma@temple.test",
      "profile_status": "Active", "is_activated": true,
      "assigned": 31, "completed": 8, "pending": 23, "cancelled": 0,
      "days_active": 8,
      "incentive": "1400.00", "revenue": "3808.00",
      "last_login": null,
      "created_at": "2026-09-08T07:34:18.667497Z"
    }
  ],
  "totals": {
    "assigned": 32, "completed": 8, "pending": 24, "cancelled": 0,
    "incentive": "1400.00", "revenue": "3808.00", "rows": 2
  }
}
```

**`incentive` and `revenue` are not the same money** — the first is what the
temple owes the poojari, the second what those poojas earned the temple. A
payout run needs the first.

`god`/`pooja` filters change what a row **counts**, they do not drop rows: a
poojari with nothing for that god legitimately reads zero.

`days_active` is distinct pooja dates performed on — four poojas in one morning
is one day.

---

### 2.9 `poojari-incentive` — Poojari Incentive Report

**Purpose** — One row per **performed booking**: the line items behind the
single figure §2.8 shows, because a payout that gets queried has to be
answerable booking by booking.

**Paths** — `GET /api/report/poojari-incentive/` · `…/export/`

**Period** over `pooja_date` · **default sort** `-pooja_date` · 12 columns

**Own filters**

| Param | Values |
|---|---|
| `poojari` · `god` · `pooja` | ids |
| `rate` | `paid` (has an incentive), `zero` (no rate set) |
| `search` | pooja, poojari or devotee name |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 12, "pooja_date": "2026-09-03",
      "poojari": "Sharma Sastrigal", "employee_id": "P-SEED-001",
      "pooja": "ഗണപതി ഹോമം", "gods": ["ഗണപതി"],
      "devotee": "ഗോപാലകൃഷ്ണൻ", "order_id": 7,
      "pooja_status": "Completed", "completed_at": "2026-09-03",
      "price": "351.00", "incentive": "150.00"
    }
  ],
  "totals": { "price": "3808.00", "incentive": "1400.00", "rows": 8 }
}
```

**Only completed bookings appear** — pending work has not been done and a
cancelled booking is not owed. The rate is snapshotted onto the booking when it
was taken, so re-rating a pooja today cannot restate a month already paid.

**Zero-rate bookings are included by default** — a pooja nobody set a rate for
is a real gap in the payout. Use `rate=paid` to exclude them.

---

### 2.10 `attendance` — Attendance Report

**Purpose** — One row per poojari: days marked present, absent or on leave over
the period, and the poojas they completed.

**Paths** — `GET /api/report/attendance/` · `…/export/`

**Period** over `date` — the day each mark is **for**, not the day it was made
· **default sort** `-present` · 15 columns

**Own filters**

| Param | Values |
|---|---|
| `profile_status` | `active`, `inactive`, `pending`, `verified` |
| `attendance` | `marked`, `unmarked`, `absent`, `leave` |
| `search` | name, phone or employee ID |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 1, "poojari": "Sharma Sastrigal", "employee_id": "P-SEED-001",
      "phone_number": null, "profile_status": "Active",
      "days_in_period": 30,
      "present": 5, "absent": 0, "leave": 1,
      "marked_days": 6, "not_marked": 24,
      "attendance_percentage": 16.7,
      "poojas_completed": 3,
      "first_marked": "2026-09-01", "last_marked": "2026-09-07"
    }
  ],
  "totals": {
    "present": 10, "absent": 0, "leave": 2,
    "marked_days": 12, "not_marked": 78, "poojas_completed": 3, "rows": 3
  },
  "period": { "period": "this_month", "date_from": "2026-09-01", "date_to": "2026-09-30" }
}
```

**`attendance_percentage` is present ÷ every day in the window**, not ÷ marked
days. A poojari who marked one day present out of thirty was here one day in
thirty.

**With `period=all_time`, `days_in_period`, `not_marked` and
`attendance_percentage` come back `null`** — an open window has no denominator.
Render an em dash, not a zero.

Attendance is per **calendar day**, never hours — there is no clock-in/clock-out
in the system, so no column here can carry one.

---

### 2.11 `admin-users` — Admin Report

**Purpose** — Every staff account, the role it holds, and whether it can still
sign in.

**Paths** — `GET /api/report/admin-users/` · `…/export/`

**Period** over `created_at` · **default period `all_time`** (not `this_month`,
unlike every other report) · **default sort** `role` · 11 columns

**Own filters**

| Param | Values |
|---|---|
| `role` | base role name (source `base_roles`) |
| `custom_role` | custom role id (source `custom_roles`) |
| `is_active` | `true`, `false` |
| `has_signed_in` | `true`, `false` |
| `search` | username, name, email or phone |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 4, "username": "doc_admin", "name": "doc_admin",
      "email": "d@t.test", "phone_number": null,
      "role": "Admin", "custom_roles": [],
      "is_active": true, "is_superuser": false,
      "last_login": "2026-09-08T07:35:07.651183Z",
      "created_at": "2026-09-08T07:34:40.197166Z"
    }
  ],
  "totals": { "active": 3, "rows": 3 }
}
```

`role` is the **base role**; `custom_roles` is a `list` of any additional roles
assigned on top (they are additive — see
[`user-management.md`](user-management.md)). Devotees are not staff and never
appear here.

---

### 2.12 `inventory` — Inventory Report

**Purpose** — One row per stock line (a product variant, because that is what
carries a SKU and a shelf): units on hand, its low-stock flag, and adjustments
over the period.

**Paths** — `GET /api/report/inventory/` · `…/export/`

**Period** over the adjustment's `created_at` · **default sort** `quantity`
(emptiest shelf first) · 15 columns

**Own filters**

| Param | Values |
|---|---|
| `stock_state` | `in_stock`, `low_stock`, `out_of_stock` |
| `status` | `active`, `inactive`, `out_of_stock` (the listing) |
| `movement` | `adjusted`, `untouched` |
| `search` | SKU, product or variant name |

**Success — `200`**

```json
{
  "rows": [
    {
      "id": 3, "sku": "IDL-103", "product": "Brass Lamp", "variant": "Large",
      "category": "Idols",
      "status": "Active", "stock_state": "Out of stock",
      "quantity": 0, "low_stock_threshold": 5,
      "price": "1800.00", "stock_value": "0.00",
      "adjustments": 2, "units_added": 12, "units_removed": 3,
      "last_adjusted_at": "2026-09-08T06:48:58Z"
    }
  ],
  "totals": {
    "quantity": 29, "stock_value": "14850.00",
    "adjustments": 6, "units_added": 36, "units_removed": 9, "rows": 3
  }
}
```

**The stock columns are a position *now*; the movement columns are over the
period.** "12 units, 3 adjustments in August" is a current count beside a
historical one — `Stock` keeps no history, so a period-aware unit count is not
available.

`stock_state` is the same rule the shop's catalogue and storefront badges use,
edges included: nothing at all is *out*, exactly the threshold is *low*. It is
independent of `status` — a line can be Active and out of stock.

**Sales are not adjustments** and are not counted: stock leaving through a
checkout is already accounted for by the order that took it.

`units_removed` is printed as a positive magnitude, though adjustments are
stored signed.

---

## 3. Export

```http
GET /api/report/<slug>/export/?format=csv
GET /api/report/<slug>/export/?format=xlsx
```

Needs `rbac.view_reports` **+** `rbac.export_reports`.

**Send the same query string the table is showing.** Every filter and the sort
are read exactly as the rows endpoint reads them, so the file is the table
without its pagination — `page` and `page_size` are ignored. The download and
the screen can never answer different questions.

`file_format` is accepted as an alias for `format`, if a client library of
yours already spends `?format=` on something else.

Returns `200` with `Content-Disposition: attachment` and a timestamped
filename: `refund_report_20260908_1204.csv`.

**CSV streams**, so the download starts immediately however large it is; XLSX
is built in memory. Both verified on all 12 reports.

Hard ceiling of **100,000 rows** per export — exceeding it is reported as a
`400`, never silently truncated.

---

## 4. Error responses

| Status | When | Body |
|---|---|---|
| `400` | Unknown sort column | `{"sort": "Cannot sort by 'nope'. Expected one of cancelled_at, channel, created_at, …, optionally prefixed with '-'."}` |
| `400` | Unknown period | `{"period": "Expected one of today, yesterday, last_7_days, …"}` |
| `400` | Malformed date | `{"date_from": "Expected a date as YYYY-MM-DD."}` |
| `400` | Range backwards | `{"date_from": "The start of the range is after its end."}` |
| `400` | Unknown export format | `{"format": "Expected one of csv, xlsx."}` |
| `400` | Export over the limit | `{"detail": "…over the 100,000 limit…", "count": …, "limit": …}` |
| `403` | No `rbac.view_reports` | DRF's permission message |
| `403` | May not run this report | `{"detail": "You do not have permission to run the Refund Report."}` |
| `404` | Unknown slug or options source | `{"detail": "No report called 'x'."}` |
| `429` | Export rate limit hit | `{"detail": "Request was throttled. Expected available in N seconds."}` |
| `503` | XLSX without `openpyxl` | `{"detail": "Excel export needs the openpyxl package…"}` |

A report the caller may not run is **`403`, not `404`** — it exists and
somebody else can run it; pretending otherwise would send an admin hunting a
broken URL.

A bad filter **value** is a `400`, not a quietly unfiltered list: a filter that
cannot be honoured is a bad request, and returning everything instead would
show an admin more than they asked for without saying so.

---

## 5. Pagination

Every report pages identically:

| Field | Meaning |
|---|---|
| `count` | Rows matching the filters — the whole set, not this page |
| `page` | Current page, 1-based |
| `page_size` | Rows per page. Default `20`, max `200` |
| `total_pages` | |
| `has_next` / `has_previous` | booleans |

Request with `?page=2&page_size=50`.

**`totals` is always over the whole filtered set, never the page** — a total
that changed as you paged would be worthless.

Every sort carries a stable tiebreak on `id`, so paging cannot repeat or skip a
row when two rows tie. Verified: consecutive pages are disjoint.
