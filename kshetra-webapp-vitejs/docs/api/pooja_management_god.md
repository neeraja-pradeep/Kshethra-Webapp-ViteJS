# Pooja Management — Gods

The **Gods** screen under Pooja Management: `/api/booking/poojacategory/`.

Gods are the master data every pooja references. The sibling screen, **Poojas**,
is documented in [pooja_management_poojas.md](pooja_management_poojas.md).

**Contents**

1. [A god is a `PoojaCategory`](#1-a-god-is-a-poojacategory)
2. [Endpoints](#2-endpoints)
3. [Permissions](#3-permissions)
4. [The list](#4-the-list)
5. [The POOJAS count](#5-the-poojas-count)
6. [Filters and search](#6-filters-and-search)
7. [Paging and the tiles](#7-paging-and-the-tiles)
8. [Display order and reordering](#8-display-order-and-reordering)
9. [Bulk actions](#9-bulk-actions)
10. [The god form](#10-the-god-form)
11. [The two images](#11-the-two-images)
12. [The Active toggle](#12-the-active-toggle)
13. [Deleting a god](#13-deleting-a-god)
14. [How poojas reference gods](#14-how-poojas-reference-gods)
15. [Caching](#15-caching)
16. [Field reference](#16-field-reference)
17. [Deliberate limits](#17-deliberate-limits)

---

## 1. A god is a `PoojaCategory`

The screen says **God**; the model is called `PoojaCategory` and the route is
`/api/booking/poojacategory/`. Same rows, older name — the table predates the
screen, and every pooja, order and report already points at it, so it was not
worth a rename to match a label.

Two consequences worth knowing:

* The payload carries a **`parent`** and a nested **`children`** list. The Gods
  screen has no hierarchy and always sends `parent: null`, but the field is
  live: a god with children cannot be deleted ([§13](#13-deleting-a-god)).
* Filters and messages elsewhere in the API say *category* where the screen says
  *god* — `?category=` on the pooja list, "Cannot delete pooja category…" on a
  refused delete.

---

## 2. Endpoints

| Method | Path | What it is |
|---|---|---|
| `GET` | `/api/booking/poojacategory/` | The list behind the table |
| `POST` | `/api/booking/poojacategory/` | *Add god* |
| `GET` | `/api/booking/poojacategory/<id>/` | One god, as the form loads it |
| `PUT` / `PATCH` | `/api/booking/poojacategory/<id>/` | Edit; `PATCH` is what the Active toggle sends |
| `DELETE` | `/api/booking/poojacategory/<id>/` | Remove a god |
| `POST` | `/api/booking/poojacategory/reorder/` | Drag-to-reorder, in one call |
| `POST` | `/api/booking/poojacategory/bulk-status/` | Turn the ticked rows on or off |
| `POST` | `/api/booking/poojacategory/bulk-delete/` | Delete the ticked rows |

**Content types.** The form posts `multipart/form-data` because a god carries
two images; the status toggle, the reorder payload and the bulk actions are
plain `application/json`. Both are accepted on every endpoint. (This viewset
used to accept multipart *only* and answered a JSON body with `415` — that is
fixed.)

---

## 3. Permissions

| Action | Requires |
|---|---|
| `list`, `retrieve` | `booking.view_poojacategory` |
| `create` | `booking.add_poojacategory` |
| `update`, `partial_update`, `reorder`, `bulk_status` | `booking.change_poojacategory` |
| `destroy`, `bulk_delete` | `booking.delete_poojacategory` |

**Reading is broad** — every signed-in role holds `view_poojacategory` through
the catalogue-read set, devotees included; the app's god list is this same
endpoint. **Writing is Temple Admin, Manager and App Manager**, matching who may
edit poojas.

Reordering and bulk-switching are changes; bulk delete is a delete. Split that
way rather than behind one "bulk" action so a role that may edit the catalogue
but not remove from it keeps exactly that.

---

## 4. The list

`GET /api/booking/poojacategory/`

```json
{
  "count": 30,
  "summary": {"total": 30, "active": 27, "inactive": 3, "next_sort_order": 31},
  "results": [
    {
      "id": 1,
      "name": "Ganesha",
      "parent": null,
      "poojas_count": 4,
      "media_url": "https://cdn.../pooja_category_1.jpg",
      "media_public_id": "pooja_category_1",
      "home_media_url": "https://cdn.../pooja_category_1_home.jpg",
      "home_media_public_id": "pooja_category_1_home",
      "is_active": true,
      "sort_order": 1,
      "children": []
    }
  ]
}
```

Against the table: **NAME** is `name`, **HOME IMAGE** is `home_media_url`,
**POOJA IMAGE** is `media_url`, **POOJAS** is `poojas_count`, **SORT ORDER** is
`sort_order` and **STATUS** is `is_active`. A missing image is `null`, which is
the placeholder tile.

Ordered by `sort_order`, then `id` — so gods sharing a number still list stably.

---

## 5. The POOJAS count

`poojas_count` is how many poojas reference this god — the `4 ↗` column.

It counts a pooja that reaches the god **either way**: as its *primary* god, or
as one of the several gods a pooja can be offered to. Counted once either way,
because those two overlap for nearly every pooja — the primary god is normally
in the god list as well, and adding the two figures would double it.

That is deliberately **the same definition the delete guard uses**, so the
column and the *"Cannot delete… it is being used by 4 poojas"* message can never
disagree ([§13](#13-deleting-a-god)).

It counts poojas regardless of *their* status, so an inactive pooja still holds
its god down. The list computes the whole page's counts in **two queries**, not
one per row.

---

## 6. Filters and search

| Query param | Effect |
|---|---|
| `?search=<text>` | The god's name, or its **id** when the box holds a number — the same bargain the pooja search makes, so one habit works on both screens |
| `?is_active=true/false` | The **All statuses** dropdown |
| `?parent_id=<id>` | Children of one god |
| `?parent_id=null` | Top-level gods only — which, on this screen, is all of them |

`?parent_id` accepts `null` or an empty value for "no parent"; anything
unparseable is ignored rather than erroring.

---

## 7. Paging and the tiles

**Paging is opt-in.** Send `?page=` or `?page_size=` and the response is a page;
send neither and it is the whole list.

```
GET /api/booking/poojacategory/?page=2&page_size=20
```

`page_size` defaults to 20 — what the screen's row selector shows — capped at
100. A paged response adds `next` and `previous`; `count` is the size of the
whole filtered list either way, so *Showing 1–20 of 30* reads straight off it.

It is opt-in for two reasons. This endpoint is the *app's* god list as well as
the back office's, and the app has always been handed every row. And
[reordering](#8-display-order-and-reordering) takes the **complete** order, so a
client about to reorder wants the unpaged list anyway.

Every response carries the tiles, **counted over the filters but not over the
page**:

```json
"summary": {"total": 30, "active": 27, "inactive": 3, "next_sort_order": 31}
```

`next_sort_order` is the exception and is not filtered: it is what the *Add god*
form's **Display order** pre-fills with, and a new god goes to the end of the
list rather than the end of a search result.

---

## 8. Display order and reordering

`sort_order` decides the order the app shows gods in, and the order this list
returns them in. Lower first; ties break by id.

```http
POST /api/booking/poojacategory/reorder/
{ "order": [7, 2, 3, 5, 4, 6, 1] }
```

Send **every god id, in the order they should appear**. They are numbered
`1..N` in that order. Returns the reordered list, so the screen can redraw
without re-fetching:

```json
{ "message": "Gods reordered successfully", "results": [ ... ] }
```

**One call, one transaction.** Dragging one row past another changes the
position of everything between them, so doing it as N `PATCH`es would leave the
list half-reordered whenever one of them failed — and would race any other admin
doing the same thing.

**The client never computes a `sort_order`.** It sends an order; the server
assigns the numbers. So a client cannot produce gaps, duplicates, or a number
that collides with a god it could not see. Renumbering also closes any gaps left
by a deleted god.

**Every god must be listed exactly once.** A partial order is refused rather
than applied — the ids left out would keep whatever numbers they had and
silently interleave themselves back through the order that was just set:

```json
{ "detail": "Send every god exactly once, in the order they should appear.",
  "missing": [8, 9], "unknown": [999] }
```

A duplicated id is refused the same way. **A paginated screen must therefore
send the whole list, not the page it dragged on** — fetch the list unpaged (the
default) before reordering.

A single `PATCH` with a `sort_order` still works for one-off edits; it just
cannot renumber the rows around it.

---

## 9. Bulk actions

The row checkboxes.

```http
POST /api/booking/poojacategory/bulk-status/
{"ids": [1, 2, 3], "status": false}
```

```json
{"message": "3 god(s) set to inactive", "updated_count": 3, "updated_ids": [1,2,3], "not_found": []}
```

```http
POST /api/booking/poojacategory/bulk-delete/
{"ids": [1, 8, 9]}
```

```json
{
  "message": "1 god(s) deleted",
  "deleted_count": 1,
  "deleted_ids": [9],
  "skipped": [
    {"id": 1, "name": "Ganesha", "reason": "Used by 4 pooja(s). Deactivate it instead."},
    {"id": 8, "name": "Kartikeya", "reason": "Has 2 child categor(ies)."}
  ],
  "not_found": []
}
```

Bulk delete applies **both** of the single delete's guards
([§13](#13-deleting-a-god)) per id, and names what it skipped — one god in use
does not block the rest of the selection. Deleting a god that nothing references
also clears both its images from storage.

Both endpoints take at most **500 ids**, reject an empty list, collapse
duplicates, and report ids that no longer exist in `not_found` rather than
failing the call.

---

## 10. The god form

`POST /api/booking/poojacategory/` — *Add god*.

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Up to 255 characters |
| `home_media` | no | **Home screen image** (file) |
| `media` | no | **Pooja image** (file) |
| `sort_order` | no | *Display order*. Defaults `0` |
| `is_active` | no | *Status*. Defaults `true` |
| `parent` | no | Unused by this screen; send nothing |

Create and update wrap the result:

```json
{ "message": "Pooja category created successfully", "data": { ...the god... } }
```

`201` on create, `200` on update, `400` with per-field messages on invalid input.

**Display order is assigned when the field is absent**: a god saved without a
`sort_order` lands at the end of the list, not at position `0`. The form
pre-fills the same number from `summary.next_sort_order`
([§7](#7-paging-and-the-tiles)), so what the user sees before saving and what
the server would have chosen agree. An explicit value is honoured, and
reordering ([§8](#8-display-order-and-reordering)) renumbers everything anyway.

---

## 11. The two images

A god carries two, and they are not interchangeable:

| Form label | Write field | Read fields |
|---|---|---|
| **Home screen image** | `home_media` | `home_media_url`, `home_media_public_id` |
| **Pooja image** | `media` | `media_url`, `media_public_id` |

Both upload to Bunny (resized to 800px wide, quality 75) and are served from the
CDN. The `*_public_id` values are the storage handles; they are read-only and
managed by the server.

**Replacing and clearing.**

* Sending a file replaces the current image: the old one is deleted from
  storage, the new one is stored under a fresh timestamped id, and the old URL
  is purged from the CDN cache. The fresh id is deliberate — reusing it would
  serve the previous picture from cache.
* Sending the field as `null` clears it and deletes the file.
* **Omitting the field leaves the image alone.** Clearing is always explicit, so
  a `PATCH` that only renames a god cannot lose its artwork.

**`PNG or JPG, up to 5 MB` is enforced**, as the box says. Both checks read what
the file *is* rather than what it is called, so a `.png` that is really a GIF is
caught:

```json
{"home_media": ["GIF images are not accepted. Upload JPG or PNG."]}
{"media": ["This image is 7.4 MB. The limit is 5.0 MB."]}
```

The size is checked before the image is decoded, so an oversized upload is
refused without being read into memory.

---

## 12. The Active toggle

`PATCH /api/booking/poojacategory/<id>/` with `is_active`, or
[`bulk-status`](#9-bulk-actions) for a ticked set.

Deactivating a god **does not touch its poojas**: they stay active and bookable,
and still name the god. The flag governs whether the god itself is offered as an
entry point in the app. To take the poojas off sale, deactivate them.

---

## 13. Deleting a god

`DELETE /api/booking/poojacategory/<id>/` → `204`.

Refused with `400` in two cases, each naming the count:

```json
{ "error": "Cannot delete pooja category as it is being used by poojas",
  "details": {"poojas_count": 4} }
```

```json
{ "error": "Cannot delete pooja category as it has child categories",
  "details": {"children_count": 2} }
```

The pooja check counts **both** ways a pooja can reference a god — as its
primary god and as a secondary one — so a god used only as a second god on one
pooja is still protected. It is the same figure the POOJAS column shows
([§5](#5-the-poojas-count)). Deactivate instead of deleting when a god is in use.

A god with no poojas and no children is deleted, and both its images are removed
from Bunny with their URLs purged.

---

## 14. How poojas reference gods

A pooja is offered to **one or more** gods, ordered, with the first as primary.
The primary is mirrored onto the pooja's legacy `category` field so single-god
clients keep working.

This is why the Poojas list can show one god under a pooja's name while a filter
on any of its gods still finds it: `?god=<id>` on `/api/booking/poojas/` matches
**any** of a pooja's gods, not just the primary. It is also why `poojas_count`
here is a union rather than a sum ([§5](#5-the-poojas-count)).

Writing the links is a pooja-side operation (`god_ids`) — see
[pooja_management_poojas.md §9](pooja_management_poojas.md#9-gods-on-a-pooja).

---

## 15. Caching

The list is cached in Redis, keyed by query string — so each search, filter and
page combination is its own entry — and invalidated on save or delete of a
**PoojaCategory** or a **PoojaGod** link. So editing a god, reordering the list,
or changing which gods a pooja is offered to all take effect on the next read
rather than at a TTL.

Writes also bump the app's `GlobalUpdate` timestamp, which is how the devotee
app knows to re-fetch.

---

## 16. Field reference

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `name` | string | Required, ≤255 |
| `parent` | int / null | Unused by this screen |
| `children` | list | Nested gods, same shape, recursive |
| `poojas_count` | int | Read-only. See [§5](#5-the-poojas-count) |
| `media` | file, write-only | Pooja image |
| `media_url` | string / null | Read-only |
| `media_public_id` | string / null | Read-only |
| `home_media` | file, write-only | Home screen image |
| `home_media_url` | string / null | Read-only |
| `home_media_public_id` | string / null | Read-only |
| `is_active` | bool | Defaults `true` |
| `sort_order` | int | Lower first; assigned to the end of the list when absent. See [§8](#8-display-order-and-reordering) |

**List envelope.** `count`, `results`, `summary` (`total`, `active`, `inactive`,
`next_sort_order`), plus `next` / `previous` when paged.

---

## 17. Deliberate limits

Things this endpoint does **not** do, and why.

* **Paging is opt-in, not default** ([§7](#7-paging-and-the-tiles)). The app
  reads this endpoint, and reordering needs the whole list.
* **Reorder takes the complete order, never a page**
  ([§8](#8-display-order-and-reordering)).
* **A god in use is never deleted**, in bulk or singly
  ([§13](#13-deleting-a-god)).
* **Only PNG and JPG are accepted** ([§11](#11-the-two-images)). The CDN
  pipeline can also open WEBP and HEIC, but the box says PNG or JPG and the
  check says what the box says.
* **The bulk endpoints ([§9](#9-bulk-actions)) have no control on this screen.**
  The Gods table's first column is drag handles, not checkboxes — they exist for
  symmetry with the Poojas screen and for scripted use.

Known rough edge, not yet addressed:

* **`children` is serialised recursively on every row** — dead weight for a
  screen with no hierarchy, and a query per row.
