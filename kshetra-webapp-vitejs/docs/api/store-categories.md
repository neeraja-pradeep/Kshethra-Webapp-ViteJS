# Store categories

The categories screen: `/api/ecommerce/category/`.

Categories are the app's shop navigation — the order they are in here is the
order a devotee sees them in. That is why the admin screen is a drag-to-reorder
list rather than a table with a sort control.

**Contents**

1. [Permissions](#1-permissions)
2. [The list](#2-the-list)
3. [Product count](#3-product-count)
4. [Active and inactive](#4-active-and-inactive)
5. [Sort order](#5-sort-order)
6. [Reordering](#6-reordering)
7. [Creating and editing](#7-creating-and-editing)
8. [Field reference](#8-field-reference)
9. [Error responses](#9-error-responses)

---

## 1. Permissions

Standard model permissions — `e_commerce.view_category` to read,
`add_category` / `change_category` / `delete_category` to write. Reordering
asks for `change_category` and no more: deciding what order the app shows
categories in is catalogue work, not a separate privilege.

**Temple Admin**, **Manager**, **App Manager** and **Store Staff** can edit.
**Devotees** hold `view_category` so the app can draw its shop navigation, and
see [only active categories](#4-active-and-inactive).

---

## 2. The list

```http
GET /api/ecommerce/category/
```

```json
{
  "count": 7,
  "results": [
    {
      "id": 2,
      "name": "Incense & Dhoop",
      "parent": null,
      "status": "active",
      "product_count": 4,
      "sort_order": 1,
      "media_url": "https://cdn.../incense.jpg",
      "media_public_id": "category_2",
      "children": [],
      "created_at": "2026-06-02T10:00:00Z",
      "updated_at": "2026-08-01T09:30:00Z"
    }
  ]
}
```

Always in `sort_order`, then `id`.

Paginated, but **100 a page by default** (up to 500 with `?page_size=`), so the
ordinary case is one request. The screen needs the whole list to drag against,
and [reordering](#6-reordering) takes the complete order — paging through ten
at a time would make a single-request job a multi-request one. The
`count`/`results` envelope is unchanged.

---

## 3. Product count

`product_count` is how many products sit in the category — the PRODUCT COUNT
column.

It counts **every** product regardless of that product's own status, which is
what makes the column add up to the total on the products screen; that screen
counts inactive lines too. Across the whole list it sums to the catalogue
total.

Direct products only — a parent category does not absorb its children's counts.

It is annotated onto the list query, so a list of categories costs the same
number of queries whether it holds seven or seventy.

---

## 4. Active and inactive

`status` is `active` or `inactive`, and new categories are `active`.

An inactive category is **switched off, not deleted**: it keeps its products,
its name and its place in the order. That is the point of having a toggle next
to a delete button.

What it does:

| Caller | Sees |
|---|---|
| Back office (holds `rbac.access_admin_portal`) | Every category — it is the screen the switch is on. Narrow with `?status=active` / `?status=inactive`. |
| The app | Active categories only. |

`?status=` is a back office **narrowing**, not a way around the toggle: asking
the app for inactive categories returns nothing rather than quietly returning
the active ones.

### What it does *not* do

Switching a category off removes it from the app's category navigation. It does
**not** change the status of the products inside it, and those products remain
reachable through search and bestsellers. If you want switching off a category
to pull its products out of the shop entirely, that is a further change to
`ShopProductsView` — say so and it can be made.

---

## 5. Sort order

Lower numbers appear first. The list is served in this order and the app draws
it in this order.

A category created **without** a `sort_order` is given `max + 1` — it lands at
the end of the list, which is what the form's pre-filled *Sort order* shows.
(The model's own default is `0`, which would have put every new category at the
top of the app's navigation.)

Numbers need not be contiguous; [reordering](#6-reordering) renumbers them
`1..N` and so closes any gaps left by a deleted category.

---

## 6. Reordering

```http
POST /api/ecommerce/category/reorder/
{ "order": [7, 2, 3, 5, 4, 6, 1] }
```

Send **every category id, in the order they should appear**. They are numbered
`1..N` in that order. Returns the reordered list, so the screen can redraw
without re-fetching.

**One call, one transaction.** Dragging one row past another changes the
position of everything between them, so doing it as N `PATCH`es would leave the
list half-reordered whenever one of them failed — and would race any other admin
doing the same thing.

**The client never computes a `sort_order`.** It sends an order; the server
assigns the numbers. So a client cannot produce gaps, duplicates, or a number
that collides with a category it could not see.

**Every category must be listed exactly once.** A partial order is refused
rather than applied — the ids left out would keep whatever numbers they had and
silently interleave themselves back through the order that was just set. The
error names what is missing or unknown:

```json
{
  "missing": [4, 6],
  "detail": "Send every category exactly once, in the order they should appear."
}
```

Inactive categories are included: switched off is not removed, and they still
hold a position for when they are switched back on.

---

## 7. Creating and editing

```http
POST  /api/ecommerce/category/
PATCH /api/ecommerce/category/<id>/
```

Both accept **JSON and multipart**. A category carries an image, so the form
posts multipart; the status toggle and the reorder payload are plain JSON. The
viewset used to accept multipart only and rejected JSON bodies with a `415`.

`name` is required. `sort_order` defaults to the end of the list, `status` to
`active`. Send `media` (multipart) to set the picture, or `media: null` to clear
it.

Deleting a category that has products **with variants** is refused; a category
whose products have no variants deletes them with it.

---

## 8. Field reference

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `name` | string | Required. |
| `parent` | int \| null | Self-reference. The admin screen is flat; nesting is supported but unused by it. |
| `status` | string | `active` or `inactive`. See §4. |
| `product_count` | int | Read-only. See §3. |
| `sort_order` | int | Lower first. See §5. |
| `sku_prefix` | string | Letters that SKUs in this category start with, e.g. `LMP` for `LMP-001`. Blank derives one from the name. See [store-catalogue.md §10](store-catalogue.md#10-skus). |
| `sku_sequence` | int | Read-only. The highest SKU number issued here, ever — numbers are never reused. |
| `media` | file | Write-only. Multipart. `null` clears the image. |
| `media_url`, `media_public_id` | string \| null | Read-only. |
| `children` | array | Nested categories, same shape. |
| `created_at`, `updated_at` | datetime | |

---

## 9. Error responses

| Request | Response |
|---|---|
| `POST` with no `name` | `400 {"name": ["This field is required."]}` |
| `status` outside the two values | `400 {"status": ["\"x\" is not a valid choice."]}` |
| Reorder missing some categories | `400` with `missing` — see §6 |
| Reorder naming an unknown id | `400` with `unknown` |
| Reorder listing one twice | `400 {"order": ["Category 3 is listed more than once."]}` |
| Reorder with an empty list | `400` |
| Deleting a category whose products have variants | `403` |

| Status | When |
|---|---|
| `401` | Not signed in. |
| `403` | Signed in without the permission in §1. |
