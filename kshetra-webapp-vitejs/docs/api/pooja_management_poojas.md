# Pooja Management — Poojas

The **Poojas** screen under Pooja Management: `/api/booking/poojas/`.

Everything the screen does — the list with its filters, sorting, paging and
tiles, the *Add pooja* form, the poojari incentive, blocking dates, bulk
actions and the CSV import — is served by one ViewSet. Its sibling screen,
**Gods**, is documented in [pooja_management_god.md](pooja_management_god.md).

**Contents**

1. [Endpoints](#1-endpoints)
2. [Permissions](#2-permissions)
3. [The list](#3-the-list)
4. [Filters and search](#4-filters-and-search)
5. [Sorting and paging](#5-sorting-and-paging)
6. [The tiles](#6-the-tiles)
7. [Bulk actions](#7-bulk-actions)
8. [The pooja form](#8-the-pooja-form)
9. [Gods on a pooja](#9-gods-on-a-pooja)
10. [Poojari incentive](#10-poojari-incentive)
11. [Unavailable dates](#11-unavailable-dates)
12. [The booking calendar](#12-the-booking-calendar)
13. [CSV import](#13-csv-import)
14. [Special poojas](#14-special-poojas)
15. [Deleting a pooja](#15-deleting-a-pooja)
16. [Caching](#16-caching)
17. [Field reference](#17-field-reference)
18. [Deliberate limits](#18-deliberate-limits)

---

## 1. Endpoints

| Method | Path | What it is |
|---|---|---|
| `GET` | `/api/booking/poojas/` | The list behind the table |
| `POST` | `/api/booking/poojas/` | *Add pooja* |
| `GET` | `/api/booking/poojas/<id>/` | One pooja, as the form loads it |
| `PUT` / `PATCH` | `/api/booking/poojas/<id>/` | Edit; `PATCH` is what the row's Active toggle sends |
| `DELETE` | `/api/booking/poojas/<id>/` | Remove a pooja |
| `POST` | `/api/booking/poojas/<id>/duplicate/` | The row menu's *Duplicate* |
| `POST` | `/api/booking/poojas/bulk-status/` | Turn the ticked rows on or off |
| `POST` | `/api/booking/poojas/bulk-delete/` | Delete the ticked rows |
| `GET` | `/api/booking/poojas/<id>/unavailable-dates/` | The blocks on this pooja |
| `POST` | `/api/booking/poojas/<id>/unavailable-dates/` | *Block* |
| `DELETE` | `/api/booking/poojas/<id>/unavailable-dates/<block_id>/` | Lift a block |
| `GET` | `/api/booking/poojas/<id>/availability/` | Blocked and bookable days over a window |
| `GET` | `/api/booking/poojas/import/template/` | *Download template* (`?sample=true` for *Load sample data*) |
| `POST` | `/api/booking/poojas/import/` | The *Import poojas* upload |
| `GET` | `/api/booking/poojas/weekly_pooja/` | Special poojas falling in the next 7 days (app home screen) |

Related, and used by the *Special pooja* section of the form:
`/api/booking/special-pooja-dates/` and
`/api/booking/special-pooja-date-repeats/`.

**Content types.** The list, the form and the import accept
`multipart/form-data` (the form posts images, the import posts a file); the
form, the blocking endpoints and the bulk actions also accept
`application/json`. Send the form as multipart whenever it carries an image.

---

## 2. Permissions

| Action | Requires |
|---|---|
| Read (`list`, `retrieve`, `weekly_pooja`, `availability`) | `booking.view_pooja` |
| Create, duplicate, import | `booking.add_pooja` |
| Edit, bulk status, block/unblock dates | `booking.change_pooja` |
| Delete, bulk delete | `booking.delete_pooja` |
| Download the template | `booking.view_pooja` |

**Reading is broad** — every signed-in role holds `booking.view_pooja` through
the catalogue-read set, devotees included; the app's pooja list is this same
endpoint. **Writing is Temple Admin, Manager and App Manager.**

Bulk status and bulk delete are **two endpoints rather than one with an
`action` field**, so RBAC can tell them apart: turning poojas off is a change,
removing them is a delete, and a role may hold one without the other.
Duplicating asks for `add_pooja`, not `change_pooja` — it writes a new pooja and
never touches the original.

Blocking dates and importing deliberately have **no permission of their own**.
Whoever may edit a pooja may take days off its calendar, and whoever may add
one may add fifty from a spreadsheet — inventing separate permissions would
mean an existing role could edit poojas but be unable to manage their calendar,
which is not a distinction the screen makes.

`unavailable_dates` covers both the `GET` and the `POST` on that path, so the
listing asks for `change_pooja` too. A read-only client that only needs to know
which days are unavailable should call **`availability`**, which asks for
`view_pooja`.

---

## 3. The list

`GET /api/booking/poojas/`

```json
{
  "count": 30,
  "summary": {"total": 30, "active": 25, "inactive": 5, "special": 18, "next_sort_order": 31},
  "results": [
    {
      "id": 12,
      "name": "Ganapathi Homa",
      "category": 1,
      "category_name": "Ganesha",
      "gods": [{"id": 1, "name": "Ganesha", "media_url": "...", "home_media_url": "...", "sort_order": 1}],
      "god_ids": [1],
      "god_names": ["Ganesha"],
      "offline_price": "2100.00",
      "online_price": "2300.00",
      "poojari_incentive": "300.00",
      "status": true,
      "special_pooja": true,
      "sort_order": 6,
      "banner_desc": "", "card_desc": "", "captions_desc": "",
      "media_url": null, "banner_url": null,
      "special_pooja_dates": [ ... ],
      "unavailable_dates": [ ... ]
    }
  ]
}
```

Row by row against the table: **POOJA** is `name` with `god_names[0]`
underneath (the *Special* chip is `special_pooja`), **OFFLINE PRICE** and
**ONLINE PRICE** are the two prices, **INCENTIVE** is `poojari_incentive` —
rendered as `—` when it is `"0.00"` ([§10](#10-poojari-incentive)) — and
**STATUS** is `status`.

`special_pooja_dates` lists only **upcoming, active, unblocked** dates; it is
always `[]` for a regular pooja. `unavailable_dates` lists the blocks that have
not yet passed ([§11](#11-unavailable-dates)).

---

## 4. Filters and search

| Query param | Effect |
|---|---|
| `?search=<text>` | Pooja name, a **god's name**, or an **id**. Romanized (Manglish) — `haridra homam` finds `ഹരിദ്ര ഹോമം` — with a fallback to the raw name so Malayalam queries work too |
| `?status=true/false` | The **All statuses** dropdown |
| `?special_pooja=true/false` | The **All types** dropdown |
| `?has_incentive=true/false` | The **All incentives** dropdown: `true` is `poojari_incentive > 0`, `false` is `= 0` |
| `?god=<id>` | Poojas offered to this god. Matches **any** of the pooja's gods, not just the primary one |
| `?category=<id>` | Older name for `?god`, kept working |
| `?gods=<id>,<id>` | Any of several gods |
| `?banner=true` | Special poojas with an active, upcoming banner date (app use) |

Filters combine with `AND`, and the tiles ([§6](#6-the-tiles)) are counted over
whatever they leave.

**Search covers the three things the box says it does** — *Search pooja, god,
or ID*. An all-digits query is matched as an id **as well as** a name fragment
rather than instead of one, because `108` is a plausible thing to have in a
pooja's name and refusing to match it would be surprising.

`?special_pooja=true` means two different things by audience: a back-office
caller (one holding `rbac.access_all_objects`) sees **every** special pooja,
including ones whose dates have all passed; a devotee sees only those with a
date still ahead. The list cache is keyed by that distinction, so the two never
serve each other's answer.

---

## 5. Sorting and paging

### Sorting

`?ordering=<field>`, `-` for descending, and it accepts a comma-separated list.
One entry per sortable header:

| Value | Sorts by |
|---|---|
| `name` | The pooja name — the **POOJA** header |
| `offline_price` | **OFFLINE PRICE** |
| `online_price` | **ONLINE PRICE** |
| `poojari_incentive` (or `incentive`) | **INCENTIVE** |
| `status` | **STATUS** |
| `sort_order`, `created_at`, `id` | Not headers, but useful |

`id` is appended as a tiebreak, so two poojas at the same price cannot swap
places between pages.

**An unknown field is a `400`, not a shrug:**

```json
{"ordering": "Cannot sort by 'prise'. Expected one of created_at, id, incentive, name, offline_price, online_price, poojari_incentive, sort_order, status."}
```

DRF's own ordering filter ignores what it does not recognise, which turns a
client-side typo into a list that is quietly in the wrong order — the one
failure a sortable table cannot show the user.

Default order is `sort_order`, then `id` — unchanged, and what the app has
always been served.

### Paging

**Paging is opt-in.** Send `?page=` or `?page_size=` and the response is a page;
send neither and it is the whole list.

```
GET /api/booking/poojas/?page=2&page_size=20
```

`page_size` defaults to 20 — what the screen's row selector shows — and is
capped at 100. A paged response adds `next` and `previous`; `count` is the size
of the **whole filtered list** either way, so *Showing 1–20 of 30* reads
straight off it.

The reason it is opt-in: this endpoint is the *app's* pooja catalogue as well
as the back office's, and the app has always been handed every row in one
response. Paginating unconditionally would silently truncate it to the first
twenty. The `count`/`results` envelope is the same in both modes, so nothing
has to change to keep working.

---

## 6. The tiles

Every list response carries a `summary`, whatever else was asked for:

```json
"summary": {"total": 30, "active": 25, "inactive": 5, "special": 18, "next_sort_order": 31}
```

`30 poojas · 25 Active · 5 Inactive · 18 Special`, in that order.

**Counted over the filters but not over the page.** With `?status=true` the
tiles describe the active list; with `?page=2` they still describe all 30, not
the twenty on the page. So a filtered screen's tiles stay honest about what the
filter selected, and paging never changes them.

`next_sort_order` is the odd one out and is deliberately **not** filtered: it is
what the form's *Display order* should pre-fill with, and a new pooja goes to
the end of the catalogue, not to the end of whatever the screen is currently
showing. See [§8](#8-the-pooja-form).

---

## 7. Bulk actions

The row checkboxes.

### Turning rows on or off

```http
POST /api/booking/poojas/bulk-status/
{"ids": [12, 14, 19], "status": false}
```

```json
{
  "message": "3 pooja(s) set to inactive",
  "updated_count": 3,
  "updated_ids": [12, 14, 19],
  "not_found": []
}
```

One call, one transaction. An id that no longer exists is **reported in
`not_found`, not fatal** — a screen someone left open should not fail the whole
action over one stale row.

### Deleting rows

```http
POST /api/booking/poojas/bulk-delete/
{"ids": [12, 14]}
```

```json
{
  "message": "1 pooja(s) deleted",
  "deleted_count": 1,
  "deleted_ids": [14],
  "skipped": [
    {"id": 12, "name": "Ganapathi Homa", "reason": "In use by orders. Deactivate it instead."}
  ],
  "not_found": []
}
```

**It deletes what it can and says what it could not.** A pooja that has been
booked is part of the record of what the temple was paid for, so the single
delete's guard ([§15](#15-deleting-a-pooja)) is applied **per id** — one booked
pooja in a selection of twenty does not block the other nineteen. Deleting also
clears the pooja's images and, for a special pooja, its published dates.

Both endpoints take at most **500 ids** and reject an empty list. Duplicate ids
are collapsed rather than refused: a client that sends the same id twice means
it once.

### Duplicating a row

```http
POST /api/booking/poojas/12/duplicate/
{}                                  // or {"name": "Ganapathi Homa (evening)"}
```

```json
{
  "message": "'Ganapathi Homa' duplicated. The copy is inactive.",
  "duplicated_from": 12,
  "data": { "id": 41, "name": "Ganapathi Homa (copy)", "status": false, ... }
}
```

Copies what makes a pooja a catalogue entry — name (suffixed `(copy)`, then
`(copy 2)`…), gods in order, both prices, the incentive, the special flag and
its copy — and lands it at the end of the list.

**The copy is created inactive.** One that went live the moment it was made
would be a second bookable pooja, with the same name under the same god, before
anyone had edited it.

**Three things are deliberately not copied.** *Images*, because two poojas
pointing at one stored file means deleting either one purges the other's
picture. *Published special pooja dates*, because those are a schedule the
temple has announced, not a property of the pooja. And *blocked dates*, because
a block says "not on this day, for this pooja".

---

## 8. The pooja form

`POST /api/booking/poojas/` — *Add pooja*.
`PATCH /api/booking/poojas/<id>/` — edit, and what the list's Active toggle
sends (`{"status": false}`).

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Malayalam or English. A romanized `search_name` is derived on every save, so search keeps working with no extra entry |
| `god_ids` | yes on create | Ordered list of god ids. Position 0 is the primary god ([§9](#9-gods-on-a-pooja)) |
| `category` | — | Legacy single-god alternative to `god_ids`; still accepted |
| `offline_price` | yes | The counter / temple rate |
| `online_price` | yes | What devotees pay in the app |
| `poojari_incentive` | no | Defaults to `0.00` ([§10](#10-poojari-incentive)) |
| `status` | no | Defaults `true` |
| `special_pooja` | no | Defaults `false`. Turns on the card, banner and scheduling ([§14](#14-special-poojas)) |
| `sort_order` | no | *Display order*; lower appears first. Defaults `0` |
| `banner_desc`, `card_desc`, `captions_desc` | no | Special-pooja copy |
| `media` | no | The pooja image (multipart file). Read back as `media_url` |
| `banner` | no | The banner image (multipart file). Read back as `banner_url` |
| `unavailable_dates` | no | The **Unavailable dates** card, saved with the pooja — see below |
| `special_pooja_dates` | no | The **Special pooja** section's scheduling — see below |

Create responds `201` with the pooja; validation failures are `400` with
per-field messages.

### The whole form in one call

The form's two sub-resource cards are saved **in the same request as the pooja
they belong to**, which is what lets *Add pooja* work at all: both cards sit on
a form for a pooja that does not exist yet, and a client should not have to
create the pooja, then post the blocks, then unpick its own mess when step two
fails.

```json
POST /api/booking/poojas/
{
  "name": "Navagraha Homa",
  "god_ids": [4],
  "offline_price": "3100.00",
  "online_price": "3300.00",
  "poojari_incentive": "250.00",
  "special_pooja": true,
  "unavailable_dates": [
    {"start_date": "2026-09-01"},
    {"start_date": "2026-10-02", "end_date": "2026-10-05", "reason": "Renovation"}
  ],
  "special_pooja_dates": [
    {"date": "2026-09-10", "time": "10:00:00", "offline_price": "3500.00", "banner": true}
  ]
}
```

Send this as **JSON**. Both fields are lists of objects, which multipart cannot
carry cleanly; a form that also uploads an image should save the image in a
second `PATCH` (or send the images and no lists, then the lists as JSON).

The whole thing is **one transaction**: a bad block or a clashing date fails the
save and leaves no pooja behind.

**`unavailable_dates` is the complete card.** On save it is reconciled to
exactly what was sent: blocks not in the list are lifted, new ones created, and
a block that was already there **keeps its id, its author and its timestamp**
rather than being deleted and re-made — re-saving an untouched form should not
rewrite its history. Omit the key and the blocks are left alone; send `[]` to
clear them.

**`special_pooja_dates` is additive.** Dates in the list are created or updated;
dates already on the pooja that the list does not mention are **left standing**.
This is the opposite of the blocks above, on purpose: a published date can have
orders against it, and deleting one silently would cancel bookings as a side
effect of an edit. Removing a date stays with
`DELETE /api/booking/special-pooja-dates/<id>/`, which unwinds the orders
properly. Refused with a `400` if the pooja is not a special pooja, if a date
appears twice, or if a date falls on a day the same save blocks (or one already
blocked) — the block wins everywhere else, and a form that set both would be
asking the server to choose.

### Display order

The server assigns it when the field is absent: a pooja saved without a
`sort_order` lands at **the end of the list**, not at position `0`. The form
pre-fills the same number from `summary.next_sort_order` ([§6](#6-the-tiles)),
so what the user sees before saving and what the server would have chosen are
the same figure. An explicit value is always honoured. Ties break by id, so
several poojas sharing a `sort_order` still list stably.

### Images

Sending an image replaces the previous one and deletes it from Bunny; sending
`null` clears the field and deletes the file. Omitting the key leaves the image
alone — clearing is always explicit.

**`PNG or JPG, up to 5 MB` is enforced**, as the upload box says. Both checks
read what the file *is*, not what it is called, so a `.png` that is really a
GIF is caught:

```json
{"banner": ["GIF images are not accepted. Upload JPG or PNG."]}
{"media": ["This image is 7.4 MB. The limit is 5.0 MB."]}
```

The size is checked before the image is decoded, so an oversized upload is
refused without being read into memory. Everything accepted is re-encoded to
WEBP on its way to the CDN.

**Do not send `special_pooja_date`** (singular). A write-only field by that name
used to be declared here and was never handled: anything sent in it reached the
model as an unknown keyword and produced a 500. It has been removed —
`special_pooja_dates` above is the supported way.

---

## 9. Gods on a pooja

A pooja is offered to **one or more gods**, held in a join table with an order.
`god_ids` writes them; the first is the **primary god** and is mirrored onto the
legacy `category` FK, so single-god clients keep working unchanged.

* `god_ids: [3, 1, 7]` sets three gods with god 3 primary.
* An empty list is rejected — a pooja always has at least one god.
* A `PATCH` that does not mention `god_ids` or `category` leaves the gods as
  they are.
* Duplicates in the list are collapsed, order preserved.

The read side gives all three shapes so a client can pick: `gods` (full brief
objects, ordered), `god_ids`, and `god_names`. `category_name` is the primary
god's name.

Multiple gods share **one price**, which is what the form says. A different
price per god means a separate pooja.

---

## 10. Poojari incentive

`poojari_incentive` is **what the poojari is paid for performing one booking**
of this pooja. It is not a charge to the devotee: it never enters
`online_price`, `offline_price`, a cart total or an order total. That is why it
is a field of its own rather than a third price.

* Decimal, two places, **defaults to `0.00`** and cannot be negative.
* There is no null state. **Zero means "no incentive"**, which is what the list
  renders as `—`, and what `?has_incentive=false` selects.

**It is snapshotted onto every booking.** When a booking is taken — through the
app cart at checkout, or at the counter as a walk-in sale — the rate standing at
that moment is copied onto the order line as `poojari_incentive` and stays
there. Re-rating a pooja later changes what future bookings pay and leaves
everything already booked exactly as it was accounted for. This is the same
reason `price` is snapshotted rather than re-read from the pooja.

The snapshot is exposed read-only on the order line, so the back office and the
poojari's own work list can report what a booking earns without re-deriving it:

```json
{ "id": 88, "pooja": 12, "price": "2100.00", "poojari_incentive": "300.00", ... }
```

Bookings taken before this field existed carry `0.00`, which is accurate — there
was no incentive to pay at the time.

---

## 11. Unavailable dates

The form's **Unavailable dates** card. A block is the temple saying *not this
day*, and it **outranks everything that says otherwise**.

### Blocking

```http
POST /api/booking/poojas/12/unavailable-dates/
{"start_date": "2026-09-01", "end_date": "2026-09-07", "reason": "Renovation"}
```

`end_date` may be omitted, sent empty or sent `null` — all three block the
single day, which is what *"Leave the second date empty to block a single day"*
means. `reason` is optional. An end before the start is a `400`.

```json
{
  "message": "Dates blocked successfully",
  "block": {
    "id": 4, "pooja": 12,
    "start_date": "2026-09-01", "end_date": "2026-09-07", "days": 7,
    "reason": "Renovation",
    "created_by": 2, "created_by_name": "Aravind Nair",
    "created_at": "2026-08-13T09:14:22Z"
  },
  "published_special_dates_inside": 2,
  "confirmed_bookings_inside": 5
}
```

Blocking the **same range twice** returns `200` with the block that already
stands rather than creating a second row — the button was pressed twice.

`GET` on the same path lists the blocks (`?include_past=false` drops ones that
have finished). `DELETE .../unavailable-dates/<block_id>/` lifts one and
returns `204`; the dates become bookable again immediately.

### What a block overrides

| Against | Effect |
|---|---|
| **A recurring schedule** | Rule-driven generation skips blocked days. `generate_dates` reports them separately as `blocked_count` / `blocked_dates`, because "left out because you blocked it" is a different fact from "it was already there" |
| **A specific special-pooja date** | Publishing a date on a blocked day is refused, with a message saying to lift the block first |
| **An already-published date** | It stops being offered: it is filtered out of `special_pooja_dates` and out of `bookable_dates` |
| **The app cart** | Adding a blocked date is a `400` listing the offending dates |
| **Checkout** | Re-checked at checkout, because a cart can sit for days and the block may be newer than the cart. Reports which lines are affected; no order is created |
| **The counter** | A walk-in sale on a blocked date is a `400`. The desk is held to the same calendar as the app |
| **The booking calendar** | `availability` and the `unavailable_dates` on every pooja payload ([§12](#12-the-booking-calendar)) |

### What a block does *not* do

**It does not cancel bookings already taken.** Cancelling moves money — refunds,
who did it, why — and that belongs to the cancel/refund endpoints built for it
(`/api/admin/orders/pooja/<id>/cancel-bookings/`). Creating a block instead
*reports* what it lands on: `confirmed_bookings_inside` and
`published_special_dates_inside`, so nobody blocks a day blind.

**It does not delete published dates.** They are hidden while the block stands
and come back if it is lifted, which makes a block reversible.

---

## 12. The booking calendar

```http
GET /api/booking/poojas/12/availability/?start=2026-09-01&end=2026-09-30
```

`start` defaults to today and `end` to 90 days out; the window is capped at 366
days.

```json
{
  "pooja": {"id": 12, "name": "Chandi Homa", "special_pooja": true, "status": true},
  "start": "2026-09-01",
  "end": "2026-09-30",
  "blocked_dates": ["2026-09-01", "2026-09-02"],
  "blocks": [ { "id": 4, "start_date": "2026-09-01", "end_date": "2026-09-02", "days": 2, ... } ],
  "bookable_dates": ["2026-09-09", "2026-09-16"]
}
```

`blocked_dates` is the block ranges expanded into individual days — what a
calendar greys out. `blocks` is the same information unexpanded, for a client
that would rather draw the span.

`bookable_dates` is **`null` for a regular pooja**, which is bookable on any day
the temple has not blocked; enumerating those would just be the window minus
`blocked_dates`. For a **special** pooja it is the finite list of published
dates with the blocked ones removed.

Every pooja payload also carries `unavailable_dates` (upcoming blocks only), so
a client that already has the pooja can grey out its calendar without a second
call.

---

## 13. CSV import

### The template

```http
GET /api/booking/poojas/import/template/            → poojas-template.csv
GET /api/booking/poojas/import/template/?sample=true → poojas-sample.csv
```

Both return `text/csv` as an attachment. The plain one is the header alone —
*Download template*; the sampled one adds example rows — *Load sample data*.
One endpoint serves both links so they cannot drift apart, and the sample is by
construction a file the importer accepts.

```csv
God,Pooja Name,Offline Price,Online Price,Status,Sort Order,Special
Ganesha,Ganapathi Homa,2100,2300,Active,1,Yes
```

### The upload

`POST /api/booking/poojas/import/` — `multipart/form-data`, one field: `file`.

| Column | Required | Accepted |
|---|---|---|
| **God** | yes | An existing god's name, case-insensitive. Several gods in one cell separated by `\|` — `Ganesha\|Durga` — with the first as primary |
| **Pooja Name** | yes | Up to 255 characters |
| **Offline Price** | yes | `2100`, `2,100` and `₹2100` all read as `2100.00`. Not negative |
| **Online Price** | yes | As above |
| **Status** | no | `Active`/`Inactive`, `Yes`/`No`, `true`/`false`, `1`/`0`. Blank → **Active** |
| **Sort Order** | no | Whole number. Blank → the next free one, counting up per row |
| **Special** | no | Same booleans, plus `Special`/`Regular`. Blank → **No** |
| **Poojari Incentive** | no | An optional eighth column, off the template. Blank → `0.00` |

Header matching ignores case, underscores and extra spaces, and a UTF-8 BOM
(what Excel writes) is stripped. Unrecognised columns are ignored, blank lines
skipped. Limits: **1000 rows**, **2 MB**, `.csv`, UTF-8.

### Rules

**A god is matched, never invented.** An unrecognised name fails its row rather
than creating a god, because gods are master data — they carry the home-screen
and pooja artwork and their own display order — and a mis-spelled name would
become a permanent, image-less entry that looks exactly like a real one in the
app. The error says so: *"No god named 'Ganesa'. Add the god first, or correct
the spelling."*

**Adding, not upserting.** The dialog says *add poojas in bulk*. A row naming a
pooja that already exists **under the same primary god** fails; it is never a
silent edit. An import that rewrote live prices because two poojas share a name
is a far worse outcome than a rejected row.

**Rows are independent.** A bad row is reported and skipped; the good ones still
import. Nobody should have to fix one typo and re-upload thirty rows.

### The response

`201` when anything was created, `400` when the file was unusable or every row
failed.

```json
{
  "message": "Imported 12 pooja(s), 2 row(s) skipped",
  "total_rows": 14,
  "created_count": 12,
  "failed_count": 2,
  "created": [ {"row": 2, "id": 41, "name": "Ganapathi Homa", "gods": ["Ganesha"], ...} ],
  "errors": [
    {"row": 4, "column": "God", "value": "Ganesa", "error": "No god named 'Ganesa'. ..."},
    {"row": 9, "column": "Offline Price", "value": "abc", "error": "Offline Price must be a number."}
  ]
}
```

`row` is the line number **as the spreadsheet shows it** — the header is row 1,
so the first data row is row 2.

A file rejected whole (wrong type, missing a required column, too big) returns
`{"error": "...", "expected_columns": [...]}` and imports nothing.

---

## 14. Special poojas

Turning on `special_pooja` turns on the card, banner and scheduling. Dates can
be published straight from the pooja form with `special_pooja_dates`
([§8](#8-the-pooja-form)); everything else about them lives in two resources of
their own:

* **`/api/booking/special-pooja-dates/`** — one published date, with its own
  optional `time`, `online_price`, `offline_price` and `banner` flag. A special
  pooja may only be booked on a published date, and a date's price overrides the
  pooja's for that day.
* **`/api/booking/special-pooja-date-repeats/`** — a recurring rule
  (`start_date`, `end_date`, `weekdays_list` with `0 = Monday`). Creating or
  updating a rule regenerates its future dates;
  `POST .../<id>/generate_dates/` re-syncs on demand.

Both honour blocks ([§11](#11-unavailable-dates)). Re-syncing only ever touches
dates from today forward, so history — and the bookings attached to it — is left
alone.

---

## 15. Deleting a pooja

`DELETE /api/booking/poojas/<id>/` → `204`.

**Refused with `403` if any order line references the pooja.** A pooja that has
been booked is part of the record of what the temple was paid for; deactivate it
with `status: false` instead. Deleting one that has never been booked also
deletes its special pooja dates and its images from Bunny.

The bulk version ([§7](#7-bulk-actions)) applies the same guard per id and
reports the skips instead of failing.

---

## 16. Caching

The list and `weekly_pooja` are cached in Redis, keyed by query string — so
each filter, sort and page combination is its own entry — and, for the list, by
whether the caller is back office or not. Cache entries are invalidated on save
or delete of a **Pooja**, a **PoojaGod** link, a **SpecialPoojaDate** or a
**PoojaUnavailableDate**, so blocking a date or a bulk status change takes
effect on the next read rather than at a TTL.

Writes also bump the app's `GlobalUpdate` timestamp, which is how the devotee
app knows to re-fetch.

---

## 17. Field reference

**Pooja (read).** `id`, `name`, `category`, `category_name`, `gods`, `god_ids`,
`god_names`, `offline_price`, `online_price`, `poojari_incentive`, `status`,
`special_pooja`, `sort_order`, `banner_desc`, `card_desc`, `captions_desc`,
`media_url`, `banner_url`, `special_pooja_dates`, `unavailable_dates`.

**Pooja (write).** `name`, `god_ids`, `category`, `offline_price`,
`online_price`, `poojari_incentive`, `status`, `special_pooja`, `sort_order`,
`banner_desc`, `card_desc`, `captions_desc`, `media`, `banner`,
`unavailable_dates`, `special_pooja_dates`.
Read-only: `media_url`, `banner_url`, `media_public_id`, `banner_public_id`.

**List envelope.** `count`, `results`, `summary` (`total`, `active`, `inactive`,
`special`, `next_sort_order`), plus `next` / `previous` when paged.

**Block.** `id`, `pooja`, `start_date`, `end_date`, `days`, `reason`,
`created_by`, `created_by_name`, `created_at`. Writable on create:
`start_date`, `end_date`, `reason`.

**Special pooja date.** `id`, `pooja`, `pooja_name`, `date`, `malayalam_date`,
`time`, `online_price`, `offline_price`, `status`, `banner`, `rule_id`,
`linked_orders_count`, `created_at`, `modified_at`.

---

## 18. Deliberate limits

Things this endpoint does **not** do, and why — so nobody re-files them as bugs.

* **Paging is opt-in, not default** ([§5](#5-sorting-and-paging)). The app
  reads this endpoint and expects the whole catalogue.
* **There is no drag-to-reorder for poojas.** `sort_order` is a form field here,
  not a column, and the screen sorts by price and status instead. The Gods
  screen, which *is* an ordered list, has one —
  [pooja_management_god.md §8](pooja_management_god.md#8-display-order-and-reordering).
* **Blocking a date does not cancel bookings inside it**
  ([§11](#11-unavailable-dates)).
* **`special_pooja_dates` on the form never deletes a date**, only the
  special-pooja-dates endpoint does ([§8](#8-the-pooja-form)).
* **A duplicate is inactive and carries no images or dates**
  ([§7](#7-bulk-actions)).
* **The importer never creates a god** ([§13](#13-csv-import)).
* **A booked pooja is never deleted**, in bulk or singly
  ([§15](#15-deleting-a-pooja)).
* **Only PNG and JPG are accepted** ([§8](#8-the-pooja-form)). The CDN pipeline
  can also open WEBP and HEIC, but the form says PNG or JPG and the check says
  what the form says.
