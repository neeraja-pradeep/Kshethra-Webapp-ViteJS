# Agent code — endpoint reference for frontend integration

Six endpoints back the four Agent code screens: the **list**, the **add** form,
the **detail** page and the **edit** form. Every response and error body below
was captured from a live run against the API — nothing here is inferred from the
serializers.

Screen → endpoint:

| Screen | Calls |
|---|---|
| Agent code list | `GET /api/admin/agent-codes/` |
| STATUS toggle on the list | `PATCH /api/admin/agent-codes/<id>/status/` |
| New code (Save code) | `POST /api/admin/agent-codes/new/` |
| Code detail (View only) | `GET /api/admin/agent-codes/<id>/` |
| Edit code (Save code) | `PATCH /api/admin/agent-codes/<id>/` |
| Delete card on the detail page | `DELETE /api/admin/agent-codes/<id>/` |

For the *why* behind the model — what a code is, why it is not a discount, why
`status` and `validity_state` are two separate questions — see
[agent-codes.md](agent-codes.md). This file is the wire contract only.

---

## Conventions that apply to all six

**Authentication.** Session cookie, `SessionAuthentication`. Send
`credentials: "include"` on every request. No token header, no `Authorization`.

**CSRF.** Required on all four writes (`POST`, `PATCH`, `DELETE`). Call
`GET /api/auth/csrf/` once on app start, then send the `csrftoken` cookie back
as the `X-CSRFToken` header. A missing or wrong token is a **403** with
`"CSRF Failed: ..."` in the body. `GET` needs no CSRF.

**Content-Type.** `application/json` on every write. The forms send JSON, not
multipart — there are no file fields on this screen.

**Permissions.** Every endpoint needs `rbac.access_admin_portal` plus a model
permission:

| Endpoint | Model permission | Roles |
|---|---|---|
| `GET` list / detail | `booking.view_agentcode` | Admin, Manager, App Manager, Reports Manager, Counter, Store |
| `POST new/` | `booking.add_agentcode` | Admin, Manager |
| `PATCH <id>/` | `booking.change_agentcode` | Admin, Manager |
| `PATCH <id>/status/` | `booking.change_agentcode` | Admin, Manager |
| `DELETE <id>/` | `booking.delete_agentcode` | Admin, Manager |

Read is deliberately wide — Counter Staff has to look a code up while settling a
booking — and writing is Admin's and Manager's only. **Hide *Add code*, *Edit*
and *Delete* for the roles that only hold read**, or those buttons will offer
what the API refuses with a 403.

**Two auth failures, two bodies** — the same on all six endpoints:

```jsonc
// 403 — not signed in
{ "detail": "Authentication credentials were not provided." }

// 403 — signed in, lacks the permission
{ "detail": "You do not have permission to perform this action." }
```

Note both are **403**, not 401: an unauthenticated request does not get a 401
here, so do not branch on the status code to decide whether to redirect to
sign-in — branch on the `detail` string, or just treat 403 as "re-check the
session, then hide the control".

**Datetimes.** `valid_from` and `valid_to` go out in the **temple's local
offset** (`2026-06-01T00:00:00+05:30`), deliberately — the VALIDITY column reads
the calendar day off the front of the string, and UTC would print the wrong day
for a window opening at midnight IST. Every other datetime (`created_at`) is
UTC with a `Z`. Send the `datetime-local` value as-is
(`2026-06-01T00:00:00`); the server localizes it.

**Money.** `order_value`, `total_order_value` and `amount` are JSON **numbers**
(`1000.0`, `0.0`), not strings. Format for display client-side — do not assume
two decimal places in the payload.

---

## 1. List the codes

- **Name / purpose:** The Agent code table and the three tiles above it
  (`6 codes`, `5 Active`, `1 Inactive`).
- **Method + path:** `GET /api/admin/agent-codes/`
- **Headers:**
  - Auth: session cookie (`credentials: "include"`)
  - CSRF: not required on `GET`
  - Content-Type: n/a
- **Path / query params:**

| Param | Values | Notes |
|---|---|---|
| `search` | any string | Case-insensitive partial match on **code or description** — the two columns the search box names. Malayalam descriptions are reachable by their romanized (Manglish) key. |
| `status` | `active`, `inactive` | The *All statuses* dropdown and the tile click-through. Omit for all. |
| `validity` | `active`, `scheduled`, `expired` | The *All validity* dropdown. Derived from the window and the clock — **not** the same question as `status`. Omit for all. |
| `ordering` | `code`, `description`, `validity`, `uses`, `order_value`, `status`, `created_at` | Prefix `-` for descending. Defaults to alphabetical by code. |
| `page` | integer ≥ 1 | Defaults to 1. |
| `page_size` | integer 1–100 | Defaults to **20** — what the screen's "20 / page" selector opens on. |

`ordering=validity` sorts by the **start** of the window (`valid_from`), because
the column prints a range and a range cannot be sorted as one value. Codes with
no start date sort first ascending, last descending.

- **Request body:** none.
- **Success response — `200 OK`:**

```json
{
  "count": 6,
  "next": "https://app.mykshethra.com/api/admin/agent-codes/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "code": "ANNADANAM",
      "description": "Annadanam desk",
      "valid_from": "2026-06-01T00:00:00+05:30",
      "valid_to": "2026-12-31T23:59:00+05:30",
      "validity_state": "active",
      "uses": 0,
      "usage_limit": null,
      "order_value": 0.0,
      "status": "active"
    }
  ],
  "summary": { "total": 6, "active": 5, "inactive": 1 }
}
```

Rendering the row: `usage_limit: null` is the **`∞`** the USES column prints, so
the cell is `` `${uses} / ${usage_limit ?? "∞"}` ``. `status` drives the toggle
and the word beside it; `validity_state` is *not* shown on the list row but is
what the VALIDITY dropdown filters on.

- **The tiles.** `summary` is counted over `search` and `validity` but
  **deliberately not over `status`** — a tile *is* how that filter is applied, so
  counting it into its own total would zero the other two on the first click and
  leave no way back. This is why `5 + 1 = 6` on the unfiltered screen, and why
  `?status=inactive` still answers `{"total": 6, "active": 5, "inactive": 1}`.
  Render the tiles straight from `summary`, never from `results.length`.

- **Error responses:**

```jsonc
// 400 — unknown ?status=
{ "status": "Expected one of active, inactive." }

// 400 — unknown ?validity=
{ "validity": "Expected one of active, scheduled, expired." }

// 400 — unknown ?ordering=
{ "ordering": "Expected one of code, created_at, description, order_value, status, uses, validity." }

// 404 — ?page= past the end
{ "detail": "Invalid page." }

// 403 — not signed in / lacks booking.view_agentcode
{ "detail": "Authentication credentials were not provided." }
```

Note the filter errors are a **flat `{field: string}`**, not the DRF
`{field: [string]}` list shape the write endpoints use. Handle both.

- **Pagination:** `PageNumberPagination` — `count`, `next`, `previous`,
  `results`, page size 20, `?page_size=` up to 100. `next`/`previous` are
  **absolute URLs** carrying every other query param forward — verified live:
  `?page_size=2` answers `next: ".../agent-codes/?page=2&page_size=2"`, and page 2
  answers `previous: ".../agent-codes/?page_size=2"` with the `page=1` dropped. `summary` sits **beside** `results`, not inside it, and is the
  same on every page.

---

## 2. Create a code

- **Name / purpose:** The *Add code* → *Save code* button. The whole form in one
  call.
- **Method + path:** `POST /api/admin/agent-codes/new/`
- **Headers:**
  - Auth: session cookie
  - CSRF: `X-CSRFToken: <csrftoken cookie>` — **required**
  - Content-Type: `application/json`
- **Path / query params:** none.
- **Request body:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | string, ≤255 | **yes** | Upper-cased and trimmed server-side — `temple50` is stored as `TEMPLE50`. |
| `description` | string, ≤2000 | no | The *Description / label* field. Defaults to `""`. |
| `valid_from` | ISO datetime or `null` | no | Blank field → `null` → works the moment it is saved. |
| `valid_to` | ISO datetime or `null` | no | Blank field → `null` → never closes. |
| `usage_limit` | integer ≥ 0 or `null` | no | Blank field → `null` → the `∞`. **`0` is stored as `null`**, not as a ceiling of none. |
| `status` | `active` \| `inactive` | no | Defaults to `active` — something just issued is meant to be usable. |

```json
{
  "code": "TEMPLE50",
  "description": "Temple-desk assisted booking",
  "valid_from": "2026-06-01T00:00:00",
  "valid_to": "2026-12-31T23:59:00",
  "usage_limit": 500,
  "status": "active"
}
```

Sending only `{"code": "SEVA"}` is valid and issues an always-open, unlimited,
active code — which is what the year-round desk codes are.

- **Success response — `201 Created`:** the **full detail shape** (§4), not the
  row. You can route straight to the detail page with what comes back.

```json
{
  "id": 40,
  "code": "TEMPLE50",
  "description": "Temple-desk assisted booking",
  "valid_from": "2026-06-01T00:00:00+05:30",
  "valid_to": "2026-12-31T23:59:00+05:30",
  "validity_state": "active",
  "uses": 0,
  "usage_limit": 500,
  "order_value": 0.0,
  "status": "active",
  "created_at": "2026-09-08T06:41:13.752864Z",
  "usage": { "times_used": 0, "total_order_value": 0.0, "bookings": [], "has_more": false },
  "deletable": true,
  "active_carts": 0
}
```

- **Error responses — all `400 Bad Request`:**

```jsonc
// duplicate, case-insensitive — POSTing "DOCPROBE1" when "docprobe1" exists
{ "code": ["This code already exists."] }

// code omitted
{ "code": ["This field is required."] }

// code blank or whitespace only
{ "code": ["This field may not be blank."] }

// valid_to <= valid_from
{ "valid_to": ["End must be after start."] }

// status not one of the two
{ "status": ["\"expired\" is not a valid choice."] }

// negative usage_limit
{ "usage_limit": ["Ensure this value is greater than or equal to 0."] }

// unparseable date — e.g. sending the displayed "01-06-2026"
{ "valid_from": ["Datetime has wrong format. Use one of these formats instead: YYYY-MM-DDThh:mm[:ss[.uuuuuu]][+HH:MM|-HH:MM|Z]."] }
```

**All field errors are lists of strings, the duplicate included.** The
uniqueness check lives in the serializer, so `errors.code[0]` is safe for every
error on this endpoint. (Before the fix this one error came back as a bare
string and `errors.code[0]` printed `T`; if you are updating an existing client,
you can drop that workaround.)

- **Pagination:** n/a.

---

## 3. Edit a code

- **Name / purpose:** The *Edit* → *Save code* button. Partial update; every
  field is optional.
- **Method + path:** `PATCH /api/admin/agent-codes/<id>/`
- **Headers:** session cookie; `X-CSRFToken` **required**;
  `Content-Type: application/json`.
- **Path params:** `id` — integer, the code's `id`.
- **Query params:** none.
- **Request body:** the same six fields as §2, all optional.

```json
{ "description": "Festival desk bookings", "usage_limit": null }
```

**`null` clears, absent leaves alone.** Sending `"usage_limit": null` blanks the
limit; omitting the key entirely leaves whatever was stored. The form's cleared
fields must therefore be sent as explicit `null`, not dropped — otherwise
clearing a date on the edit screen silently does nothing.

The window is validated against the **saved** dates, not only against what the
request carries: a PATCH that moves `valid_from` past an untouched `valid_to` is
rejected the same as one that sends both.

- **Success response — `200 OK`:** the full detail shape (§4), reflecting the
  edit. An empty body `{}` is accepted and returns the unchanged code.

- **Error responses:**

```jsonc
// 400 — renaming onto another existing code (case-insensitive)
{ "code": ["This code already exists."] }

// 400 — window broken, checked against the saved dates too
{ "valid_to": ["End must be after start."] }

// 404 — no such code
{ "detail": "Agent code not found." }
```

All the §2 field errors apply here as well. Renaming a code to its own current
name is **not** a duplicate — it returns `200`.

- **Pagination:** n/a.

---

## 4. Get one code

- **Name / purpose:** The code's own page — the header card, the USAGE card with
  its two tiles and booking list, and the state of the *Delete code* card.
- **Method + path:** `GET /api/admin/agent-codes/<id>/`
- **Headers:** session cookie. No CSRF, no Content-Type.
- **Path params:** `id` — integer.
- **Query params:** none. **The usage list is not paginated or filterable** —
  see below.
- **Request body:** none.
- **Success response — `200 OK`:**

```json
{
  "id": 43,
  "code": "USEDCODE",
  "description": "Has a booking",
  "valid_from": null,
  "valid_to": null,
  "validity_state": "active",
  "uses": 1,
  "usage_limit": null,
  "order_value": 750.0,
  "status": "active",
  "created_at": "2026-09-08T06:41:42.701171Z",
  "usage": {
    "times_used": 1,
    "total_order_value": 750.0,
    "bookings": [
      {
        "order_id": 14,
        "order_ref": "PO-14",
        "devotee": "Asha Nair",
        "pooja_summary": "Ganapathi Homam, Bhagavathi Seva +2 more",
        "pooja_count": 4,
        "date": "2026-07-04",
        "amount": 750.0,
        "paid": false,
        "status": "pending"
      }
    ],
    "has_more": false
  },
  "deletable": false,
  "active_carts": 0
}
```

Everything in the list row (§1), plus:

| Field | Notes |
|---|---|
| `created_at` | UTC, `Z`-suffixed — unlike the two window dates. |
| `usage.times_used` | The **Times used** tile. Same count as `uses`. |
| `usage.total_order_value` | The **Total order value** tile. Same as `order_value`. |
| `usage.bookings` | The **50 most recent** of those bookings, newest first. Empty array → render *"This code hasn't been used on any bookings yet."* |
| `usage.has_more` | `true` when the code has more bookings than the card lists — i.e. the tiles read higher than `bookings.length`. |
| `deletable` | Drives the *Delete code* card — `true` shows the button, `false` shows the *Deactivate instead* note. |
| `active_carts` | Live carts holding this code. Blocks deletion the same way a booking does, and is why `deletable` can be `false` while `times_used` is `0`. |

Per booking row: `order_ref` is the reference the rest of the back office prints
(`PO-<id>`) and links to the order page. `date` is the **first** pooja date on
the order, `null` if none. `paid: false` is the *At counter* chip — money not yet
collected, which is the normal state for these bookings, sometimes for days.
`pooja_summary` is already truncated server-side to two names plus `+N more`.

**A cancelled booking is not a use.** It is excluded from `uses`,
`order_value`, both tiles and the booking list — verified live: a code whose only
booking was cancelled reports `times_used: 0`, `deletable: true`.

- **Error responses:**

```jsonc
// 404
{ "detail": "Agent code not found." }
```

- **Pagination: `usage.bookings` is capped at the 50 most recent bookings**, and
  there is no `?page=` to walk past them. The tiles above the card are counted in
  the database over *every* non-cancelled booking, so the cap cannot make them
  wrong.

  **Never derive the tiles from the list.** Once a code passes 50 uses,
  `times_used` and `bookings.length` part company by design, and `has_more` goes
  `true` — show the tiles from `times_used` / `total_order_value` and label the
  card as showing the most recent 50. `deletable` likewise reads the true count,
  so a heavily-used code still reports itself undeletable.

  (Before the fix this list was unbounded: a year-round desk code returned every
  booking it had ever taken on each detail load, which made the payload and the
  query grow without limit.)

---

## 5. Toggle status

- **Name / purpose:** The switch in the STATUS column of the list. Writes
  `status` and nothing else.
- **Method + path:** `PATCH /api/admin/agent-codes/<id>/status/`
- **Headers:** session cookie; `X-CSRFToken` **required**;
  `Content-Type: application/json`.
- **Path params:** `id` — integer.
- **Query params:** none.
- **Request body:**

```json
{ "status": "inactive" }
```

`status` is required, and must be `active` or `inactive`. This endpoint exists
separately from §3 so that a switch on a list screen cannot send a stale copy of
every other field back with it — **use it for the toggle, not `PATCH <id>/`**.

- **Success response — `200 OK`:** the **list row** shape (§1), not the detail.
  Splice it straight back into the table row.

```json
{
  "id": 40,
  "code": "TEMPLE50",
  "description": "Temple-desk assisted booking",
  "valid_from": null,
  "valid_to": null,
  "validity_state": "active",
  "uses": 0,
  "usage_limit": null,
  "order_value": 0.0,
  "status": "inactive"
}
```

The response carries no `summary`, so the tiles above the table are **not**
updated by this call. Adjust the two counts locally, or refetch the list.

Setting the status it already has is a no-op that still returns `200`.
Switching a code off stops it being redeemed immediately; it touches neither the
window, the limit, nor the bookings already placed under it, so switching it back
on restores exactly the code that was withdrawn.

- **Error responses:**

```jsonc
// 400 — not one of the two
{ "status": ["\"expired\" is not a valid choice."] }

// 400 — field omitted
{ "status": ["This field is required."] }

// 404
{ "detail": "Agent code not found." }
```

- **Pagination:** n/a.

---

## 6. Delete a code

- **Name / purpose:** The *Delete* button on the detail page's delete card.
  Permanent, and only ever offered for a code nobody has used.
- **Method + path:** `DELETE /api/admin/agent-codes/<id>/`
- **Headers:** session cookie; `X-CSRFToken` **required**. No Content-Type.
- **Path params:** `id` — integer.
- **Query params:** none.
- **Request body:** none.
- **Success response — `204 No Content`, empty body.** Do not attempt to parse
  JSON from it.
- **Error responses:**

```jsonc
// 400 — the code has been used, or is held in a live cart
{
  "detail": "This code has been used and cannot be deleted. Switch it off instead to keep the records.",
  "bookings": 1,
  "active_carts": 0
}

// 404 — no such code, or already deleted
{ "detail": "Agent code not found." }
```

The guard is `deletable` from §4, enforced server-side rather than trusted to the
button: a code applied to a booking is part of that booking's record — it is why
the devotee was allowed to pay at the desk — and deleting it would leave the
booking claiming it was settled under a code that no longer exists.

`bookings` and `active_carts` in the 400 tell you *which* of the two guards
tripped, so the message can be specific: `active_carts: 1, bookings: 0` means a
devotee is holding the code in a cart right now and the code may be deletable in
a few minutes, which is a different thing to tell the admin than "this code has
history". The `detail` string covers only the first case — **compose your own
message from the two counts** rather than showing `detail` verbatim when
`bookings` is `0`.

- **Pagination:** n/a.

---

## 7. Field reference

**Row** (list, and the toggle response):

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `code` | string | Always stored upper-case. |
| `description` | string | `""` when unset, never `null`. |
| `valid_from` | ISO datetime \| `null` | Temple-local offset. `null` = always open. |
| `valid_to` | ISO datetime \| `null` | Temple-local offset. `null` = never closes. |
| `validity_state` | `active` \| `scheduled` \| `expired` | Derived from the window and the clock, never stored. |
| `uses` | int | Non-cancelled bookings against the code. |
| `usage_limit` | int \| `null` | `null` = `∞`. |
| `order_value` | number | Sum of those bookings' totals. `0.0` when unused. |
| `status` | `active` \| `inactive` | The admin's switch. |

**Detail** = Row + `created_at` (UTC), `usage {times_used, total_order_value,
bookings[], has_more}`, `deletable` (bool), `active_carts` (int).

**Usage booking** = `order_id`, `order_ref`, `devotee`, `pooja_summary`,
`pooja_count`, `date` (date \| `null`), `amount` (number), `paid` (bool),
`status` (string).

### `status` vs `validity_state` — the one thing to get right

They are independent, and both can be true at once. A code kept switched on for
next year's festival reads `status: "active"` **and**
`validity_state: "expired"`. The STATUS column and the *All statuses* dropdown
and the tiles are all `status`; the *All validity* dropdown is `validity_state`.
Never derive one from the other, and never show a code as "expired" in the STATUS
column because its window has closed — the legacy `expired` value still exists on
old rows in the database but is never written any more, and the API will not
accept it as input on any endpoint.

---

## 8. Verification

Every status code, response body and error body in this document was captured
from a live run on 2026-09-08 — the read paths against the running backend's real
data, the write paths (create, edit, toggle, delete, and both delete guards)
against an isolated test database so that no production rows were created or
destroyed. The screen's own regression suite,
`python manage.py test temple_admin.test_agent_codes`, passes at **58/58**, and
the wider `temple_admin booking rbac` suites at **1077/1077**.

Run the suite against its own database so two sessions do not collide over
`test_temple`:

```bash
TEST_DB_NAME=test_temple_<yourname> python manage.py test temple_admin.test_agent_codes
```

One shape to keep in mind when writing the form layer:

- **Field errors** (both write endpoints) are `{field: [string]}` — a list.
- **Filter errors** (query params on the list) are `{field: string}` — flat.
  This is the convention across all the admin list screens, not a quirk of this
  one, so a shared error handler should cope with both.
