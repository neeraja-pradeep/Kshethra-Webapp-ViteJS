# Store catalogue

The products screen: `/api/admin/store/products/`.

**Contents**

1. [Why this endpoint exists](#1-why-this-endpoint-exists)
2. [Permissions](#2-permissions)
3. [The list](#3-the-list)
4. [Stock state](#4-stock-state)
5. [The tiles](#5-the-tiles)
6. [Filters](#6-filters)
7. [Sorting and paging](#7-sorting-and-paging)
8. [The Active toggle](#8-the-active-toggle)
9. [The product form](#9-the-product-form)
10. [SKUs](#10-skus)
11. [Product images](#11-product-images)
12. [Adjusting stock](#12-adjusting-stock)
13. [Field reference](#13-field-reference)
14. [The two-level API](#14-the-two-level-api)

---

## 1. Why this endpoint exists

The shop's data model has two levels. A **`Product`** carries the name,
category and description; one or more **`ProductVariant`** rows under it carry
what is actually sold — the SKU, price, picture and stock. The devotee app
needs that split, because one product page shows one thing in three sizes.

The admin catalogue screen is **flat**: one row is one sellable line, and the
product form takes a single price and a single stock figure. Rather than make
every client re-derive that shape by fetching products, then variants, then
stock, this endpoint serves it directly — **one row per product, with its
primary variant's fields flattened in**.

The primary variant is the lowest-id one. Nearly every product has exactly one,
which is what makes the flat view honest. Where a legacy product has more, the
row reports **`variant_count` above 1** so a client can say so rather than
silently present one variant as the whole product.

Nothing here writes variants, so no existing multi-variant product is flattened
or lost — [§14](#14-the-two-level-api) is still how those are managed.

---

## 2. Permissions

| Endpoint | Requires |
|---|---|
| `GET /api/admin/store/products/` | `rbac.access_admin_portal`, `e_commerce.view_product`, `e_commerce.view_productvariant` |
| `PATCH /api/admin/store/products/<id>/status/` | `rbac.access_admin_portal`, `e_commerce.change_product` |
| `POST /api/admin/store/products/new/` | `rbac.access_admin_portal`, `e_commerce.add_product`, `e_commerce.add_productvariant` |
| `GET /api/admin/store/products/<id>/` | as the list |
| `PATCH /api/admin/store/products/<id>/` | `rbac.access_admin_portal`, `e_commerce.change_product`, `e_commerce.change_productvariant` |
| `DELETE /api/admin/store/products/<id>/` | `rbac.access_admin_portal`, `e_commerce.delete_product` |
| `POST /api/admin/store/products/<id>/stock/` | `rbac.access_admin_portal`, `e_commerce.change_stock` |
| `GET /api/admin/store/products/<id>/stock/` | `rbac.access_admin_portal`, `e_commerce.view_stock` |

**Reading** — the list and a single product — is open to every back office
role, Counter Staff and Reports Manager included: they already hold the
catalogue read permissions. **Writing** is **Temple Admin**, **Manager**, **App
Manager** and **Store Staff**; adjusting stock is Temple Admin, Manager and
Store Staff only.

Creating a product asks for **no stock permission**, because it writes no stock
(§9) — which is what keeps **App Manager**, the catalogue's owner and
deliberately given no stock permission, able to use their own form. They cannot
adjust stock; **Store Staff** and **Temple Admin** can do both.

`access_admin_portal` rather than `access_all_objects` — a product belongs to
nobody, so there is no ownership to lift. What is being drawn is the line
between the storefront and the back office: devotees hold `view_product` so
they can browse the shop, and this screen lists what is *not* for sale
(inactive lines, discontinued ones, every SKU's stock level).

It deliberately does **not** ask for `view_stock`. App Manager owns the
catalogue but holds no stock permission, and the stock figure is already served
to any signed-in shopper by `ShopProductsView` — gating on it would lock the
catalogue's owner out of their own screen to hide a number that is not hidden.

---

## 3. The list

```http
GET /api/admin/store/products/?search=diya&ordering=-price
```

```json
{
  "count": 24,
  "next": "...?page=2",
  "previous": null,
  "results": [
    {
      "id": 12,
      "name": "Brass Diya (Small)",
      "slug": "brass-diya-small",
      "sku": "LMP-001",
      "category": { "id": 2, "name": "Lamps & Diyas" },
      "price": "250.00",
      "image_url": "https://cdn.../lmp-001.jpg",
      "stock_quantity": 45,
      "stock_state": "in_stock",
      "low_stock_threshold": 10,
      "status": "active",
      "status_display": "Active",
      "variant_id": 31,
      "variant_count": 1,
      "created_at": "2026-07-02T09:12:00Z",
      "updated_at": "2026-08-01T11:40:00Z"
    }
  ],
  "summary": {
    "total": 24,
    "by_stock_state": { "in_stock": 16, "low_stock": 5, "out_of_stock": 3 }
  }
}
```

A product with **no variant yet** still appears, with `sku`, `price` and
`variant_id` all `null`, `variant_count: 0`, and no stock — which is what the
new-product form shows before anything is saved against it.

---

## 4. Stock state

`stock_state` is **derived, never stored**, so it cannot drift from the stock
it describes:

```
quantity <= 0                    → out_of_stock
quantity <= low_stock_threshold  → low_stock
otherwise                        → in_stock
```

Both edges matter and are pinned by tests: nothing at all is *out*, and
**exactly** the threshold is *low* — a shelf that has reached the number
somebody set as the alarm has tripped it, not almost.

`low_stock_threshold` is **per variant**, defaulting to 10 (the "LOW-STOCK
ALERT AT 10 units" the product form shows). Per variant rather than one global
setting because a temple sells camphor by the hundred and brass idols by the
handful; a single number would either cry wolf on one or stay silent on the
other until it ran out.

### `stock_state` is not `status`

They are separate columns on the screen and separate ideas:

| | Answers | Set by |
|---|---|---|
| `status` | Are we choosing to sell this? | The Active toggle |
| `stock_state` | Do we have any? | The stock on the shelf |

A line can be Active and out of stock, or Inactive with a full shelf.

`status` is the **product's**, not the variant's. The variant has a status
field too, but a signal flips it to `out_of_stock` whenever the shelf empties,
so it answers the second question, not the first.

---

## 5. The tiles

`summary` rides on the paginated response:

| Field | Tile |
|---|---|
| `total` | *N products* |
| `by_stock_state.in_stock` | *N In stock* |
| `by_stock_state.low_stock` | *N Low stock* |
| `by_stock_state.out_of_stock` | *N Out of stock* |

All three states are **always present, even at zero** — they are fixed tiles,
and one that vanished when it hit zero would move the other three.

The three always sum to `total`.

### One deliberate difference from the order feed

Tiles are counted over the `search`, `category` and `status` filters — *"5 low
stock in Lamps & Diyas"* is the useful reading — but **not** over
`?stock_state=` itself.

A tile is how you apply that filter. Counting it into its own total would zero
the other three the moment one was clicked, leaving no way back to them. (The
order feed's tiles *do* narrow with every filter, because there the tiles
report money over a date range rather than a facet you click.)

---

## 6. Filters

| Parameter | Accepts | Notes |
|---|---|---|
| `search` | free text | Partial, case-insensitive, over product name **and** SKU. Matches *any* variant's SKU, not just the primary one — somebody typing a code off a shelf label should find the product it belongs to. |
| `category` | a category id, or part of a name | The dropdown sends the id. |
| `status` | `active`, `inactive`, `discontinued` | Exact match on the product's status. |
| `stock_state` | `in_stock`, `low_stock`, `out_of_stock` | The tile click-through. |
| `ordering` | see §7 | |
| `page`, `page_size` | integers | |

All combinable. An unknown `status`, `stock_state` or `ordering` is a `400`
naming the field and what it accepts, rather than being ignored.

---

## 7. Sorting and paging

`?ordering=` takes `name`, `sku`, `category`, `price`, `stock` or `created_at`,
prefixed with `-` for descending. **Alphabetical by name** when omitted, which
is how the screen opens. `id` is applied behind whatever you ask for, so two
products with the same name keep a fixed order between pages.

`price` and `stock` sort on the primary variant's figures, so a product with no
variant sorts as `0` rather than dropping out of the list.

Paging defaults to **20 a page** (the screen's row selector), `?page_size=` up
to 100. `count` and `summary` are both the whole filtered catalogue, not the
page.

---

## 8. The Active toggle

```http
PATCH /api/admin/store/products/<id>/status/
{ "status": "inactive" }
```

Writes the product's status and nothing else, and returns **the whole row back**
so the list can redraw without re-fetching.

Only `active` and `inactive` are accepted. `discontinued` is a real product
status and can be filtered on, but it is not something a two-position switch
should express — taking a line out of the catalogue for good is a different
decision from hiding it for now, and should not be one mis-click away.

Editing a product properly — name, price, images, stock — is the product form,
a separate endpoint. Keeping the toggle narrow means a switch on a list screen
cannot quietly send a stale copy of every other field back with it.

---

## 9. The product form

```http
POST  /api/admin/store/products/new/        create
GET   /api/admin/store/products/<id>/       load for editing
PATCH /api/admin/store/products/<id>/       save
DELETE /api/admin/store/products/<id>/      delete
```

**One call writes what the API keeps in three tables** — the `Product`, the
`ProductVariant` carrying its price and SKU, and its pictures — in one
transaction, so a half-saved product cannot exist. It used to be two calls plus
a SKU the form had no way to invent.

| Field | Required | Notes |
|---|---|---|
| `name` | **yes** | |
| `category` | no | |
| `price` | no | The variant's. Defaults to `0.00`, as the form's field does. |
| `description` | no | |
| `status` | no | `active` (default) or `inactive`. |
| `low_stock_threshold` | no | Defaults to 10 — the form's *LOW-STOCK ALERT AT 10 units*. |
| `images` | no | Repeat the key once per file (multipart). See §11. |
| `remove_images` | no | Image ids to drop, on `PATCH`. |

Accepts multipart (for the pictures) and JSON. `GET` and the two writes return
the same flat row the list serves, **plus `description` and `images`** —
everything the form draws, in one request.

Three things the form does not send and does not have to:

- **A product type.** The form has only Category, and `Product.product_type` is
  now optional; a product created here has none. (Deleting a product type also
  no longer deletes its products — it `SET_NULL`s them. It used to `CASCADE`,
  which is a great deal of damage for what is only a label.)
- **A SKU** — see §10.
- **Stock.** A new product starts with an empty shelf, reading `0` /
  `out_of_stock`, exactly as the form's INVENTORY panel shows before saving.
  Stock is then filled by §12, which is what *"Save the product first, then
  adjust stock with a logged reason"* promises.

---

## 10. SKUs

The form never asks for a SKU, yet every catalogue row shows one. They are
issued as `<prefix>-<number>`, zero padded to three: `LMP-001`, `INC-005`.

**The prefix is stored on the category** (`Category.sku_prefix`), not computed
from its name, because the codes a temple already prints on its shelf labels
follow no rule anything could infer — `Lamps & Diyas` is `LMP`, `Books & Media`
is `BOK`, and `Puja Kits` is `KIT`, off the *second* word. Set it per category.
Left blank, a default is derived from the name (first word, first three
letters), which is a reasonable starting point rather than an attempt to
reproduce those.

**Numbers are never reused.** Each category carries a counter, so deleting
`LMP-003` does not free it — the next lamp is `LMP-004`. A code that has been on
a shelf label, an invoice or a delivery note should not come back meaning
something else.

**Codes typed in by hand are respected.** The issuer takes the higher of the
counter and the largest number already in use, so a catalogue imported at
`LMP-014` carries on from there rather than colliding with it.

Saving a product locks its category row while the number is taken, so two
admins saving into the same category at the same moment queue rather than
racing; a clash is retried.

---

## 11. Product images

`ProductImage` rows hang off the **product**, not the variant — the grid
belongs to the product as the admin sees it, and the same photographs sell
every size of it.

- Add by sending `images` (repeat the key per file, multipart).
- Remove by naming ids in `remove_images`, which also deletes them from the
  CDN.
- Order is `sort_order`; **the first image leads**.

The lead image is **mirrored onto the primary variant's `media_url`** whenever
the grid changes. The storefront has read that field since before products had
a gallery, so mirroring keeps the shop showing the same picture the admin put
first without changing every reader.

The list endpoint does not carry `images` — twenty-four rows of picture arrays
is a payload the table has no use for. It carries `image_url`, the lead one.

---

## 12. Adjusting stock

```http
POST /api/admin/store/products/<id>/stock/
{ "delta": 60, "reason": "Delivery from supplier" }

GET  /api/admin/store/products/<id>/stock/    the history
```

Send **either** `quantity` (the new count, after a stock take) **or** `delta`
(how much it moved by, when a delivery arrives) — never both. "There are 40 on
the shelf" and "12 arrived" are different statements, and guessing which was
meant is how a stock take goes wrong.

**`reason` is required.** Every change writes a `StockAdjustment` recording who
made it, the count before and after, and why. Stock used to move as a bare
field write, so a count that was wrong on Tuesday could not be explained on
Wednesday.

| Refused | Because |
|---|---|
| No `reason` | The reason is the feature. |
| Both `quantity` and `delta`, or neither | Ambiguous. |
| A result below zero | Reports what is actually on the shelf. |
| A change of zero | An adjustment that changes nothing is not a record. |

The stock row is locked for the adjustment, so two admins counting the same
shelf cannot both write from the same starting figure. Emptying a shelf flips
the variant to `out_of_stock` and refilling it puts it back on sale, through the
same signal the rest of the shop uses.

**Sales are not logged here.** Stock leaving through a checkout or a counter
sale is already accounted for by the order that took it; logging it again would
read as though the shelf had been counted twice.

The history returns newest first: `{id, delta, quantity_before, quantity_after,
reason, adjusted_by, created_at}`.

---

## 13. Field reference

| Field | Type | Notes |
|---|---|---|
| `id` | int | The **product's** id — what the toggle and the form address. |
| `name`, `slug` | string | |
| `sku` | string \| null | Primary variant's. `null` when there is no variant yet. |
| `category` | object \| null | `{id, name}`. |
| `price` | string \| null | Decimal as a string. |
| `image_url` | string \| null | Primary variant's picture. |
| `stock_quantity` | int | Units on the shelf. `0` when no stock is recorded. |
| `stock_state` | string | `in_stock`, `low_stock`, `out_of_stock`. Derived — see §4. |
| `low_stock_threshold` | int | Where "low" starts for this line. |
| `status`, `status_display` | string | The product's status; what the toggle writes. |
| `variant_id` | int \| null | The variant the flattened figures came off. |
| `variant_count` | int | **Above 1 means this flat row shows only the primary variant** — use the two-level API for that product. |
| `created_at`, `updated_at` | datetime | |
| `description` | string | **Form responses only** (`GET`/`POST`/`PATCH` on a single product). |
| `images` | array | **Form responses only.** `{id, url, sort_order}`, lead image first. |

---

## 14. The two-level API

`/api/ecommerce/product-variant/` is unchanged and remains how a multi-variant
product is managed. It gained the same capabilities:

| Parameter | Notes |
|---|---|
| `?search=` | Partial match over variant name, SKU and parent product name. |
| `?status=` | The **variant's** status (`active`, `inactive`, `out_of_stock`). |
| `?stock_state=` | The same derived state, same definition. |
| `?ordering=` | `name`, `sku`, `price`, `status`, `created_at`, `product__name`. |
| `?category=`, `?product=`, `?sku=`, `?name=` | As before, exact match. |

Its serializer now also returns `stock_state` and `low_stock_threshold`
alongside the existing `stock` and `available_stock`.

The stock-state rule is defined **once**, in `e_commerce/stock.py` (as SQL) and
`e_commerce.models.stock_state_for` (in Python, for a single loaded variant).
Two statements of one rule is a thing worth being nervous about, so the tests
assert they agree row for row over a catalogue covering all three states and
both threshold edges.
