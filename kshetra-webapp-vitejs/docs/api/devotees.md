# Devotees

The App → Devotees screen: `/api/admin/devotees/`.

**Contents**

1. [Why this endpoint exists](#1-why-this-endpoint-exists)
2. [Permissions](#2-permissions)
3. [The list](#3-the-list)
4. [The three computed columns](#4-the-three-computed-columns)
5. [The tiles](#5-the-tiles)
6. [Search](#6-search)
7. [The status filter](#7-the-status-filter)
8. [Sorting and paging](#8-sorting-and-paging)
9. [One devotee](#9-one-devotee)
10. [Suspending an account](#10-suspending-an-account)
11. [Field reference](#11-field-reference)

---

## 1. Why this endpoint exists

A **devotee** is a `CustomUser` whose role is `temple_user` — somebody who
signed up in the app. Staff and poojaris are the *Users & Roles* screen's
business and never appear here.

That is why this is a separate endpoint from `/api/rbac/users/` rather than a
filter on it. The two screens answer different questions, need different
permissions, and share nothing but the table they read from:

| | `/api/rbac/users/` | `/api/admin/devotees/` |
|---|---|---|
| Who | Staff and poojaris | App sign-ups |
| Created by | An admin, on the screen | The devotee, in the app |
| Carries | Base role, assigned roles, effective permissions | Family, bookings, last activity |
| Writes | Role, name, email, password, active | Active, and nothing else |

**Nothing here creates an account**, because nothing but signing up in the app
can. There is no `POST`.

---

## 2. Permissions

| Endpoint | Requires |
|---|---|
| `GET /api/admin/devotees/` | `rbac.access_admin_portal`, `rbac.view_devotees`, `authentication.view_customuser`, `temple_user.view_userlist` |
| `GET /api/admin/devotees/<id>/` | as the list, plus `temple_user.view_userattribute` |
| `PATCH /api/admin/devotees/<id>/status/` | `rbac.access_admin_portal`, `rbac.manage_devotees` |

By role:

| | Admin | Manager | App Manager | Reports Manager | Counter | Store | Poojari |
|---|---|---|---|---|---|---|---|
| Read | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Suspend / reinstate | ✅ | ✅ | ✅ | — | — | — | — |

**App Manager holds both.** The screen sits under *App* in the sidebar, and the
app's sign-ups are one of its screens. The role stays orderless: the BOOKINGS
column is a count served by this endpoint, and comes with sight of no order,
payment or refund.

**Reports Manager reads but does not suspend** — the role touches nothing, and
suspending is a change.

Two deliberate choices about which permissions gate this:

- **Not `rbac.manage_users`.** That one is in `DANGEROUS_PERMISSIONS` because
  it mints staff accounts and sets their role. Reading the app's sign-ups is
  not that, and a devotee account cannot be created here at all, so there is
  nothing to escalate to.
- **The status endpoint asks for `manage_devotees` alone, not
  `authentication.change_customuser`.** That permission is what staffs the
  team, and it is withheld from Manager and App Manager precisely so neither
  can edit a user record. Flipping one devotee's sign-in is a different act,
  and requiring both would mean only Admin could ever action a screen the other
  two own.

In the [modules map](roles-and-permissions.md), this is the `devotees` module,
with capabilities `read` and `suspend` — that is what the frontend reads to
decide whether to render the nav item and the suspend control, and what an
admin ticks to grant the screen to a custom role.

---

## 3. The list

```http
GET /api/admin/devotees/?search=pillai&ordering=-bookings
```

```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 41,
      "name": "Priya Desai",
      "phone_number": "+91 90370 88123",
      "email": "priya@example.com",
      "family_count": 2,
      "booking_count": 2,
      "last_activity": "2026-07-08T12:00:00+05:30",
      "status": "active"
    }
  ],
  "summary": { "total": 12, "active": 11, "suspended": 1 }
}
```

`name` is `first_name last_name`, falling back to **`username`** when both are
blank — sign-up does not require a name, and the column has to print something.

`phone_number` is returned **exactly as stored**. The screen groups it as
`+91 90370 88123`; formatting it server-side would mean the API could no longer
tell a client what is actually in the record. Search handles the difference —
see [§6](#6-search).

---

## 4. The three computed columns

None of these is stored. All three are computed in SQL rather than per row,
which is what makes them sortable and what keeps a page at **3 queries** — the
page, its count and the tiles — whether it returns 1 row or 20.

### `family_count` — the FAMILY column

How many people the devotee books for: their saved `UserList` profiles.
Themselves included, which is what makes the smallest value on a devotee who
has booked anything **1**, not 0. An account that has never opened the family
screen reports 0.

### `booking_count` — the BOOKINGS column

`PoojaOrderLine` rows on their orders. **That model, not `PoojaOrder`**, is
what this project calls a booking — *one pooja, for one person, on one date* —
so the figure agrees with the [Pooja Bookings](pooja-bookings.md) screen rather
than quietly counting something else under the same word.

- **Cancelled and refunded lines do not count.** A date called off is not
  something the devotee booked with the temple. The [detail
  view](#9-one-devotee) does still list them; the count answers *how much have
  they booked*, the list answers *what has happened on this account*.
- **Counter sales never land here.** A walk-in order belongs to the clerk who
  rang it up, not to any devotee account.
- Summed across **every** order the devotee has placed, not per order.

### `last_activity` — the LAST ACTIVITY column

The most recent of:

1. their last pooja order,
2. their last shop order,
3. their last sign-in (`last_login`),

falling back to the day they joined. Ordering alone would be wrong: a devotee
who has never ordered anything has still been active, and the screen has to
date them too. The value is never null.

---

## 5. The tiles

```json
"summary": { "total": 12, "active": 11, "suspended": 1 }
```

Counted over the **search** but **not** over `?status=` itself. A tile is how
that filter is applied, so counting it into its own total would zero the other
two the moment one was clicked and leave no way back to them. It is also why
`active + suspended == total` on the unfiltered screen.

The search does narrow all three — *"3 suspended out of 8 matching Pillai"* is
the useful reading.

The tiles are on **every page**, not just the first: they sit above the table
and do not move as it is paged.

---

## 6. Search

`?search=` matches, case-insensitively and partially:

| | Matched against |
|---|---|
| **Name** | The assembled `first_name last_name` — the string the column prints |
| **Username** | For accounts with no name set |
| **Email** | `email` |
| **Phone** | The number's digits, separators ignored |
| **Family** | The name of any `UserList` profile they book for |

Three of those need explaining, because all three are cases where matching the
*columns* would fail on exactly what the *screen* prints.

**Name.** A devotee shown as `Lakshmi Narayan Iyer` has `first_name =
"Lakshmi Narayan"` and `last_name = "Iyer"`. Matching the two fields separately
would find nothing for `"Lakshmi Narayan Iyer"` or `"Narayan Iyer"`, because
neither string is in either field. The assembled name is matched instead.

**Phone.** The screen always prints a number grouped — `+91 90370 88123` — but
the database stores whatever the client sent: ten bare digits from the app's
own sign-up form, E.164 from a Firebase sign-in. Both sides are reduced to
digits before comparing, and a term longer than 10 digits is matched on its
last 10, so the country code is optional in **either** direction:

| Typed | Stored `9037088123` | Stored `+919037088123` | Stored `+91 90370 88123` |
|---|---|---|---|
| `9037088123` | ✅ | ✅ | ✅ |
| `90370 88123` | ✅ | ✅ | ✅ |
| `+91 90370 88123` | ✅ | ✅ | ✅ |
| `88123` | ✅ | ✅ | ✅ |

**Malayalam names.** A devotee registered as `ഹനുമാൻ സ്വാമി` is unreachable
from any of the clauses above unless the operator types Malayalam. Both the
account holder's name and every family profile carry a romanized `search_name`
key alongside the real one, so `hanuman` finds `ഹനുമാൻ` — the same Manglish
search the pooja, god, order and catalogue screens use. The raw name is still
matched too, so a Malayalam-script query keeps working.

A devotee is returned **once** however many family members match.

All of this narrows the tiles as well as the table — a romanized match the
table returned but the tiles did not would print *"1 of 0 devotees"*.

---

## 7. The status filter

`?status=` takes `active` or `suspended`; omit it for *All statuses*. Anything
else is `400`.

Two values, not the four a staff account has: a devotee account is either
usable or it is not, and the screen says so in one word. It maps to `is_active`
— see [§10](#10-suspending-an-account).

---

## 8. Sorting and paging

`?ordering=` takes any of the five sortable headers, `-` for descending:

| Value | Sorts by |
|---|---|
| `name` | The name as printed, so an account with no name sorts by its username |
| `family` | `family_count` |
| `bookings` | `booking_count` |
| `last_activity` | `last_activity` |
| `status` | **Active first** ascending |

Anything else is `400`. Omitted, the list opens **most recently active first**
(`-last_activity`), which is the order the screen opens in. `id` is always the
tiebreaker, so two devotees with the same value keep a fixed order between
pages.

`status` sorts on a derived value rather than on `is_active` so that ascending
puts Active first, the way the two printed words sort. Ordering on the boolean
would put `False` — Suspended — first, and clicking the header once would do
the opposite of what its arrow says.

Paging is `?page=` and `?page_size=`, **20 a page** by default (what the
`20 / page` selector opens on), capped at 100.

---

## 9. One devotee

```http
GET /api/admin/devotees/41/
```

The row, plus what it is a summary *of*: the family profiles behind the FAMILY
figure and the bookings behind the BOOKINGS one.

```json
{
  "id": 41,
  "name": "Lakshmi Narayan Iyer",
  "username": "lakshmi_iyer",
  "phone_number": "+91 98470 11234",
  "email": "lakshmi@example.com",
  "family_count": 2,
  "booking_count": 2,
  "last_activity": "2026-07-01T09:12:44+05:30",
  "status": "active",
  "joined_at": "2026-02-14T18:03:11+05:30",
  "last_login": "2026-07-01T09:12:44+05:30",
  "family": [
    {
      "id": 88,
      "name": "Lakshmi Narayan Iyer",
      "dob": "1985-04-12",
      "time": "06:30:00",
      "is_self": true,
      "nakshatrams": ["Rohini"]
    },
    {
      "id": 89,
      "name": "Arjun Iyer",
      "dob": null,
      "time": null,
      "is_self": false,
      "nakshatrams": ["Ashwathi"]
    }
  ],
  "recent_bookings": [
    {
      "id": 5120,
      "order_id": 981,
      "pooja": "Ganapathi Homam",
      "date": "2026-07-05",
      "booked_for": "Lakshmi Narayan Iyer",
      "status": "confirmed",
      "pooja_status": "completed",
      "price": "751.00"
    }
  ],
  "recent_orders": [
    {
      "id": 344,
      "status": "delivered",
      "payment_status": "paid",
      "total": "250.00",
      "created_at": "2026-06-22T11:40:02+05:30"
    }
  ]
}
```

- `is_self` is `true` on the profile that is the account holder themselves.
- `nakshatrams` lists only the profile's **active** attributes.
- `recent_bookings` and `recent_orders` carry **at most 10** each, newest
  first. Enough to see the shape of an account without turning a detail call
  into a report.
- `recent_bookings` **does** include cancelled bookings, unlike
  `booking_count`. See [§4](#4-the-three-computed-columns).

A staff or poojari id returns **404**, rather than serving one: a staff account
read through this screen would have every one of these figures wrong.

Staff accounts have the equivalent drill-down at
[`/api/rbac/users/<id>/`](user-management.md).

---

## 10. Suspending an account

```http
PATCH /api/admin/devotees/41/status/
Content-Type: application/json

{ "status": "suspended" }
```

Returns the updated row, in the same shape the table renders. `status` must be
`active` or `suspended`; anything else is `400`, and a staff or poojari id is
`404`.

**Suspending revokes sign-in and nothing else.** The account, its family
profiles, its bookings and the receipts they earned all stay exactly where they
are — a devotee who paid at the counter has to remain attributable afterwards,
which is the same reason `/api/rbac/users/` deactivates a staff account instead
of deleting it. A suspended devotee still carries their family and booking
figures on the screen.

It writes `is_active = false`, so any session or app token the devotee already
holds stops working on their **next request** — Django's authentication refuses
an inactive user. There is no separate token revocation step.

The call is idempotent: setting the status it already has is a no-op and still
returns `200`.

---

## 11. Field reference

### List row

| Field | Type | Notes |
|---|---|---|
| `id` | int | The `CustomUser` id. What the detail and status URLs take |
| `name` | string | `first_name last_name`, or `username` when both are blank |
| `phone_number` | string \| null | Exactly as stored, unformatted |
| `email` | string \| null | |
| `family_count` | int | Saved `UserList` profiles, the account holder included |
| `booking_count` | int | Non-cancelled `PoojaOrderLine` rows across every order |
| `last_activity` | datetime | Never null — see [§4](#4-the-three-computed-columns) |
| `status` | string | `active` or `suspended` |

### Envelope

| Field | Type | Notes |
|---|---|---|
| `count` | int | Rows matching the filters, across all pages |
| `next` / `previous` | url \| null | Standard DRF paging |
| `results` | array | The rows |
| `summary` | object | `{ total, active, suspended }` — the tiles, on every page |

### Detail, in addition to the row

| Field | Type | Notes |
|---|---|---|
| `username` | string | The sign-in identifier |
| `joined_at` | datetime | When the account was created |
| `last_login` | datetime \| null | Null if they have never signed in |
| `family` | array | `id`, `name`, `dob`, `time`, `is_self`, `nakshatrams[]` |
| `recent_bookings` | array | Up to 10; `id`, `order_id`, `pooja`, `date`, `booked_for`, `status`, `pooja_status`, `price` |
| `recent_orders` | array | Up to 10; `id`, `status`, `payment_status`, `total`, `created_at` |

### Query parameters

| Parameter | Values |
|---|---|
| `search` | Free text — name, username, email, phone or family member. Romanized (Manglish) too — `neyy vilakku` finds `നെയ്യ് വിളക്ക്` — with the raw name still matched so Malayalam-script queries keep working. |
| `status` | `active`, `suspended` |
| `ordering` | `name`, `family`, `bookings`, `last_activity`, `status`; `-` for descending |
| `page` | 1-based |
| `page_size` | Default 20, max 100 |
