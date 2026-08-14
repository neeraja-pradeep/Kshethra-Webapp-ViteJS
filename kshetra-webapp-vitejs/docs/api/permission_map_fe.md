# Permission Map — Frontend Integration Guide

**Read this to build the permissions UI.** It is the complete API contract: response
shapes, guarantees you may rely on, and the list of modules and capability keys.

**The backend is not built yet.** The shapes below are fixed and will not change —
mock them now and the integration is a URL swap when the backend lands. Backend
implementation details live in
[permission_map_be.md](permission_map_be.md); you should not need it.

> **Companion doc:** [permission_map_be.md](permission_map_be.md) — backend
> implementation plan, enforcement internals, and the audit of which permissions
> gate which endpoints.

---

## 1. What changes for you

Today `GET /api/rbac/users/{id}/` returns a flat list of ~135 raw Django codenames:

```json
"effective_permissions": [
  "authentication.add_customuser",
  "booking.add_agentcode",
  "booking.add_counterreceipt",
  "booking.change_counterreceipt",
  "...132 more"
]
```

Rendering that verbatim shows the operator `add_counterreceipt`,
`delete_serviceablepincode` — database vocabulary, not product vocabulary. It is
also grouped by Django app label, which does not match how the product is
organised: `booking` alone contains the pooja catalogue, the counter desk, the
devotee cart and the admin order back office.

The backend will add a **`modules`** key: product modules (*Counter Bookings*,
*Store Orders*) each carrying capability booleans.

```jsonc
"modules": {
  "counter_bookings": {
    "label": "Counter Bookings",
    "capabilities": { "read": true, "create": true, "cancel": false }
  }
}
```

You ask `modules.counter_bookings.create` and render the button. You never see a
codename, and you never hardcode a permission string.

The map works in both directions, and you will use both:

| Direction | You do | Endpoint |
|---|---|---|
| **Read** (§3) | Show/hide menus and buttons | `GET /api/rbac/me/permissions/` |
| **Grant** (§4) | Let an admin compose a role from modules | `PUT /api/rbac/roles/{id}/modules/` |

Because the same map drives both, a capability an admin ticks is exactly the
capability the UI then reports.

### 1.1 Two rules that matter

**A capability is all-or-nothing.** `create: true` means the user holds *every*
permission that action needs. The backend mirrors how the server actually gates
requests, so a `true` you receive will not 403 when clicked, and a `false` would
have. Trust the boolean; do not try to reconstruct it from the raw permission list.

**It is still a UI layer, not security.** The server independently gates every
request. Hiding a button is a courtesy to the operator, not a control — never treat
a capability flag as permission to skip error handling on the response.

### 1.2 What it cannot tell you

Capabilities are **per-user**, not per-row. `store_orders.read: true` means "may
read orders", not "may read *this* order". The backend separately scopes some users
to their own records (a devotee sees only their own orders), and no per-user boolean
can express that. Expect a 403 or a filtered list on specific rows even when the
capability is `true`.

Also note: `modules` covers the **admin portal**. Devotee and poojari app screens
are gated differently and resolve every admin module to `false`.

---

## 2. The modules

Twelve modules. These keys are API surface and stable — key off them. `label` is
display text and may be re-worded without notice, so render it, never compare it.

The role columns tell you who resolves `true`, so you can predict what each role
sees without setting up test accounts:
**A**dmin · **M**anager · **AM** App Manager · **R** Reports Manager · **C** Counter
Staff · **S** Store Staff. Devotee and Poojari are omitted — every admin module is
`false` for them.

The **Requires** column is informational — it is what the backend checks. You do not
send or check these.

### 2.1 `dashboard` — Dashboard

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.view_admin_dashboard` | ✅ | ✅ | — | — | — | — |

Endpoint: `GET /api/admin/dashboard/data/`

> Deliberately narrow. The dashboard reports takings and fulfilment; App Manager and
> Reports Manager are both kept off the landing screen by design.

### 2.2 `pooja_orders` — Pooja Orders

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.manage_pooja_orders` + `booking.view_poojaorder` | ✅ | ✅ | — | ✅ | — | — |
| `create` | `rbac.manage_pooja_orders` + `booking.add_poojaorder` | ✅ | ✅ | — | — | — | — |
| `update` | `rbac.manage_pooja_orders` + `booking.change_poojaorder` | ✅ | ✅ | — | — | — | — |
| `delete` | `rbac.manage_pooja_orders` + `booking.delete_poojaorder` | ✅ | ✅ | — | — | — | — |
| `refund` | `rbac.refund_pooja_order` | ✅ | ✅ | — | — | — | — |
| `export` | `rbac.export_pooja_orders` | ✅ | ✅ | — | ✅ | — | — |

Endpoints: `/api/booking/admin/orders/…`, `/api/admin/orders/pooja/{id}/…`,
`/api/report/export/pooja-orders/`

> Reports Manager reads and exports but cannot write — it holds `manage_pooja_orders`
> with view-only model permissions. This is the pattern that makes the whole
> read-only role work, and it only reads correctly under the AND rule.
>
> `refund` is separate from `update` because both cancel endpoints move money and sit
> behind `refund_pooja_order` rather than the plain back office scope.

### 2.3 `counter_bookings` — Counter Bookings

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.operate_counter` | ✅ | ✅ | — | — | ✅ | — |
| `create` | `rbac.operate_counter` + `booking.add_poojaorder` | ✅ | ✅ | — | — | ✅ | — |
| `cancel` | `rbac.cancel_counter_sale` | ✅ | ✅ | — | — | — | — |
| `collect_payment` | `rbac.collect_counter_payment` | ✅ | ✅ | — | — | ✅ | — |

Endpoints: `/api/booking/counter/sales/…`, `/api/booking/counter/agent-bookings/…`

> **This is the module the request named.** Note what it is *not* built from:
> `add_counterreceipt` / `change_counterreceipt` gate no endpoint (see permission_map_be.md §3). The desk is
> gated on `operate_counter`; the receipt is protected per-row by guardian instead.
> A naive model-derived grouping would have produced the wrong answer here.
>
> No `update` and no `delete`: a counter sale is never edited, and voiding is
> `cancel` — deliberately a step above taking the sale, which is why Counter Staff
> can `create` but not `cancel`.

### 2.4 `bookings_execution` — Booking Execution

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.manage_pooja_orders` + `booking.view_poojaorderline` | ✅ | ✅ | — | ✅ | — | — |
| `complete` | `rbac.manage_pooja_orders` + `booking.change_poojaorderline` | ✅ | ✅ | — | — | — | — |
| `assign` | `rbac.assign_poojari` + `booking.change_poojaorderline` | ✅ | ✅ | — | — | — | — |

Endpoints: `/api/admin/bookings/all/`, `/api/admin/bookings/complete/`,
`/api/admin/bookings/assign/`

> `assign` is split from `complete` on purpose: rostering poojaris is a different job
> from handling an order, so a duty manager can be given `assign_poojari` without the
> rest of the back office.

### 2.5 `pooja_catalogue` — Poojas & Categories

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `booking.view_pooja` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `create` | `booking.add_pooja` | ✅ | ✅ | ✅ | — | — | — |
| `update` | `booking.change_pooja` | ✅ | ✅ | ✅ | — | — | — |
| `delete` | `booking.delete_pooja` | ✅ | ✅ | ✅ | — | — | — |

Endpoints: `/api/booking/poojas/…`, `/api/booking/poojacategory/…`

> `read` is true for every role — the pooja catalogue is in `CATALOGUE_READ`, which
> every role including devotees holds, because you cannot book what you cannot see.
> A frontend using `read` to decide whether to show a *nav item* should combine it
> with `access_admin_portal`; see §3.3.
>
> Bulk actions map onto the same flags: `bulk_status`/`reorder` → `update`,
> `bulk_delete` → `delete`, `import`/`duplicate` → `create`.

### 2.6 `store_orders` — Store Orders

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.access_all_objects` + `e_commerce.view_order` + `e_commerce.view_orderline` | ✅ | ✅ | — | ✅ | — | ✅ |
| `create` | `rbac.access_all_objects` + `e_commerce.add_order` + `e_commerce.add_orderline` + `e_commerce.change_stock` | ✅ | ✅ | — | — | — | ✅ |
| `update` | `rbac.access_all_objects` + `e_commerce.change_order` | ✅ | ✅ | — | — | — | ✅ |
| `refund` | `rbac.access_all_objects` + `rbac.refund_ecommerce_order` + `e_commerce.change_order` | ✅ | ✅ | — | — | — | ✅ |
| `export` | `rbac.export_ecommerce_orders` | ✅ | ✅ | — | ✅ | — | ✅ |

Endpoints: `/api/admin/orders/product/…`, `/api/report/export/ecommerce-orders/`

> `access_all_objects` carries real weight here and must not be dropped from the
> list. These endpoints act on an order named in the URL and do no ownership check of
> their own; a devotee holds `view_order` and `add_order` for their own records, so
> without it they would resolve `true` and be shown a back-office screen.
>
> `create` is the walk-in sale, which also moves stock — hence `change_stock`.

### 2.7 `store_products` — Store Catalogue

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.access_admin_portal` + `e_commerce.view_product` + `e_commerce.view_productvariant` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `create` | `rbac.access_admin_portal` + `e_commerce.add_product` + `e_commerce.add_productvariant` | ✅ | ✅ | ✅ | — | — | ✅ |
| `update` | `rbac.access_admin_portal` + `e_commerce.change_product` + `e_commerce.change_productvariant` | ✅ | ✅ | ✅ | — | — | ✅ |
| `delete` | `rbac.access_admin_portal` + `e_commerce.delete_product` | ✅ | ✅ | ✅ | — | — | ✅ |

Endpoints: `/api/admin/store/products/…`

> `read` resolves true for Counter Staff because they hold `access_admin_portal` plus
> the catalogue reads. That is correct — the endpoint does admit them — but they have
> no reason to see the screen, so nav visibility is a separate decision (§3.3).
>
> `create`/`update` require the **variant** permissions too: one call writes the
> product and the variant carrying its price and SKU. A role that may add a product
> but not price it must not get the form.

### 2.8 `stock` — Stock

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.access_admin_portal` + `e_commerce.view_stock` | ✅ | ✅ | — | ✅ | — | ✅ |
| `update` | `rbac.access_admin_portal` + `e_commerce.change_stock` | ✅ | ✅ | — | — | — | ✅ |

Endpoint: `GET`/`POST /api/admin/store/products/{id}/stock/`

> Split from `store_products` precisely because App Manager owns the catalogue but is
> deliberately given **no** stock permission. Folding stock into the products module
> would either lock App Manager out of its own screen or hand it the shelf.

### 2.9 `poojaris` — Poojaris

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.manage_poojaris` + `temple_poojari.view_poojariprofile` | ✅ | ✅ | — | ✅ | — | — |
| `create` | `rbac.manage_poojaris` + `temple_poojari.add_poojariprofile` | ✅ | ✅ | — | — | — | — |
| `update` | `rbac.manage_poojaris` + `temple_poojari.change_poojariprofile` | ✅ | ✅ | — | — | — | — |
| `delete` | `rbac.manage_poojaris` + `temple_poojari.delete_poojariprofile` | ✅ | ✅ | — | — | — | — |
| `register` | `rbac.register_poojari` | ✅ | ✅ | — | — | — | — |
| `activate` | `rbac.activate_poojari` | ✅ | ✅ | — | — | — | — |
| `export` | `rbac.export_poojari` | ✅ | ✅ | — | ✅ | — | — |

Endpoints: `/api/admin/poojaris/…`, `/api/admin/register-poojari/`,
`/api/report/export/poojari/`

> `manage_poojaris` is what keeps poojaris themselves out of this module — they hold
> `view`/`change_poojariprofile` for their **own** profile, which is why the model
> permission alone cannot gate the screen.

### 2.10 `notifications` — Notifications

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.manage_notifications` + `notifications.view_notifications` | ✅ | ✅ | ✅ | ✅ | — | — |
| `create` | `rbac.manage_notifications` + `notifications.add_notifications` | ✅ | ✅ | ✅ | — | — | — |
| `update` | `rbac.manage_notifications` + `notifications.change_notifications` | ✅ | ✅ | ✅ | — | — | — |
| `delete` | `rbac.manage_notifications` + `notifications.delete_notifications` | ✅ | ✅ | ✅ | — | — | — |
| `send` | `rbac.send_notification` | ✅ | ✅ | ✅ | — | — | — |
| `statistics` | `rbac.view_notification_statistics` | ✅ | ✅ | ✅ | — | — | — |

Endpoints: `/api/notifications/notifications/…`, `/api/notifications/send/`

> The devotee **inbox** (`/api/notifications/inbox/`) is deliberately not part of this
> module — it is the devotee app, gated on `notifications.*_inbox` and scoped per-row
> by guardian. Campaigns and inboxes share a Django app but are different products.

### 2.11 `users` — Staff Accounts

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.assign_roles` + `authentication.view_customuser` | ✅ | — | — | — | — | — |
| `create` | `rbac.manage_users` + `authentication.add_customuser` | ✅ | — | — | — | — | — |
| `update` | `rbac.manage_users` + `authentication.change_customuser` | ✅ | — | — | — | — | — |
| `delete` | `rbac.manage_users` + `authentication.change_customuser` | ✅ | — | — | — | — | — |

Endpoints: `/api/rbac/users/…`

> `delete` requires **`change`**, not `delete_customuser` — DELETE deactivates and
> keeps the row so a clerk who took counter payments stays attributable. The flag is
> named `delete` because that is the button; the permission is the real one.
>
> Only Admin. `MANAGER_DENIED` subtracts exactly this from the Manager set — only
> Admin staffs the team.

### 2.12 `roles` — Roles

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `rbac.assign_roles` | ✅ | — | — | — | — | — |
| `create` | `rbac.manage_roles` | ✅ | — | — | — | — | — |
| `update` | `rbac.manage_roles` | ✅ | — | — | — | — | — |
| `delete` | `rbac.manage_roles` | ✅ | — | — | — | — | — |
| `assign` | `rbac.assign_roles` | ✅ | — | — | — | — | — |

Endpoints: `/api/rbac/roles/…`

> `create`/`update`/`delete` need `manage_roles`; `read`/`assign` need only
> `assign_roles`. The split exists so a role can be allowed to hand out existing
> roles without being able to invent new powers — keep the two flags distinct in the
> UI or the distinction is lost.

### 2.13 `songs` — Songs

| Capability | Requires | A | M | AM | R | C | S |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `read` | `song.view_song` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `create` | `song.add_song` | ✅ | ✅ | ✅ | — | — | — |
| `update` | `song.change_song` | ✅ | ✅ | ✅ | — | — | — |
| `delete` | `song.delete_song` | ✅ | ✅ | ✅ | — | — | — |

Endpoints: `/api/song/songs/…`

---

## 3. Reading capabilities

**Not yet implemented — build the frontend against this shape.** It is fixed; the
backend work will produce exactly this.

### 3.1 Endpoints

Both existing endpoints gain a `modules` key. Nothing is removed —
`permissions` / `effective_permissions` stay for backwards compatibility, so this
ships without a breaking change and the frontend migrates when ready.

| Endpoint | Change | Who |
|---|---|---|
| `GET /api/rbac/me/permissions/` | add `modules` | The signed-in user — drives menus and buttons |
| `GET /api/rbac/users/{id}/` | add `modules` | An admin inspecting another user |
| `GET /api/rbac/modules/` *(new)* | the map itself, unresolved | Role editor — render module/capability checkboxes |

### 3.2 `GET /api/rbac/me/permissions/`

```jsonc
{
  "id": 4,
  "username": "verify-admin",
  "base_role": "temple_admin",
  "is_superuser": false,
  "roles": [],

  // NEW — resolved per user, strict AND
  "modules": {
    "counter_bookings": {
      "label": "Counter Bookings",
      "capabilities": {
        "read": true,
        "create": true,
        "cancel": false,
        "collect_payment": true
      }
    },
    "store_orders": {
      "label": "Store Orders",
      "capabilities": {
        "read": true, "create": true, "update": true,
        "refund": false, "export": false
      }
    }
    // ...one entry per module in §2
  },

  // unchanged, kept for compatibility
  "permissions": ["authentication.add_customuser", "..."]
}
```

**Guarantees the frontend may rely on:**

- Every module in §2 is present on every response, for every user. A module the user
  cannot touch appears with all capabilities `false` — never omitted. No
  `hasOwnProperty` checks needed.
- Every capability listed for a module in §2 is present. Absent key = backend bug,
  not "false".
- Values are strictly `true` / `false`. Never `null`, never a permission list.
- `is_superuser: true` ⇒ every capability `true`.
- Keys are stable snake_case identifiers and are API surface. `label` is display
  text and may be re-worded without notice — **key off the key, render the label.**

### 3.3 Nav visibility vs. button visibility

`read` answers "may this user call the list endpoint". It does **not** answer "should
this appear in the sidebar" — §2.5 and §2.7 both resolve `read: true` for roles with
no business on those screens, because the endpoints genuinely do admit them.

Recommended frontend rule:

```
show nav item  ⇔  modules[m].capabilities.read  AND  user reaches the admin portal
show button    ⇔  modules[m].capabilities.<capability>
```

If a dedicated nav flag is wanted rather than a frontend convention, add
`"visible": true|false` per module alongside `capabilities` — decide before
implementation, since adding it later means touching every consumer.

### 3.4 `GET /api/rbac/modules/` — the unresolved map

The whole map rather than one user's answers. Drives the role editor's checkbox
tree, and tells the frontend what capability keys exist without hardcoding them.

```jsonc
{
  "modules": [
    {
      "key": "counter_bookings",
      "label": "Counter Bookings",
      "description": "The counter desk: walk-in bookings and agent-code collections.",
      "capabilities": [
        {
          "key": "create",
          "label": "Take a booking",
          "permissions": ["rbac.operate_counter", "booking.add_poojaorder"],
          "dangerous": false
        },
        {
          "key": "cancel",
          "label": "Void a sale",
          "permissions": ["rbac.cancel_counter_sale"],
          "dangerous": false
        }
      ]
    }
  ],
  "dangerous_permissions": [
    "rbac.access_all_objects", "rbac.assign_roles",
    "rbac.manage_roles", "rbac.manage_users"
  ]
}
```

`permissions` is exposed so the editor can show "what this actually grants" on
hover, and so an advanced view can still fall back to raw permission editing. The
frontend does **not** need to send these back — the grant API (§4) takes capability
keys and expands them server-side.

`dangerous` mirrors `DANGEROUS_PERMISSIONS`: `true` when any permission in the
capability is in that set. Granting one turns a limited role into an effective
admin, so the UI should make the operator confirm.

### 3.5 Migration path

1. Backend ships `modules` alongside the existing keys — additive, nothing breaks.
2. Frontend switches screens over one at a time, reading `modules`.
3. The raw list stays available for the debug/advanced view.

---

## 4. Granting capabilities

The role editor: an admin composes a custom role out of modules instead of picking
codenames off the checkbox wall.

Two constraints to design the screen around:

- **Custom roles only.** The eight built-in roles (Admin, Manager, App Manager,
  Reports Manager, Counter Staff, Store Staff, Poojari, Devotee) are defined in code
  and cannot be edited through the API — a `PUT` against one returns 400. Render
  them read-only.
- **Grants go to roles, not users.** There is no "give this one user Counter
  Bookings cancel" call. To give a person a capability, put them in a role that has
  it. This keeps every grant visible and auditable on the roles screen.

### 4.1 Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/rbac/roles/{id}/modules/` | The role's current grants, as capabilities |
| `PUT /api/rbac/roles/{id}/modules/` | Replace the role's grants with exactly this set |
| `PATCH /api/rbac/roles/{id}/modules/` | Add/remove named capabilities, leave the rest alone |

`POST /api/rbac/roles/` also accepts a `modules` key, so a role can be created
module-shaped in one call instead of create-then-grant.

All three sit behind `rbac.manage_roles` — the same gate as editing a role's
permissions, which is what they do.

### 4.2 `GET /api/rbac/roles/{id}/modules/`

```jsonc
{
  "role": { "id": 7, "name": "counter_lead", "label": "Counter Lead" },
  "modules": {
    "counter_bookings": {
      "label": "Counter Bookings",
      "capabilities": {
        "read": true, "create": true,
        "cancel": true, "collect_payment": false
      }
    },
    "pooja_orders": {
      "label": "Pooja Orders",
      "capabilities": {
        "read": true, "create": false, "update": false,
        "delete": false, "refund": false, "export": false
      }
    }
    // ...every module, same shape as §3.2
  },
  "unmapped_permissions": ["booking.view_agentcode"]
}
```

Same guarantees as §3.2: every module and capability always present, strictly
boolean.

**`unmapped_permissions`** is the honest part. A role's Group may hold permissions
that no capability accounts for — granted through the raw permission API, or left
over from before the module map existed. The module view cannot represent them, so
it names them rather than silently hiding them. The UI should surface this as
"granted outside the module editor" so an operator is never shown an incomplete
picture of a role. It is `[]` for a role built purely through this API.

### 4.3 `PUT` — replace

Send the complete desired state. Anything absent is revoked.

```jsonc
// PUT /api/rbac/roles/7/modules/
{
  "modules": {
    "counter_bookings": ["read", "create", "cancel"],
    "pooja_orders": ["read"]
  }
}
```

The backend expands this to the union of the named capabilities' permissions and
calls the existing `set_role_permissions`:

```
counter_bookings.read    → rbac.operate_counter
counter_bookings.create  → rbac.operate_counter, booking.add_poojaorder
counter_bookings.cancel  → rbac.cancel_counter_sale
pooja_orders.read        → rbac.manage_pooja_orders, booking.view_poojaorder
                            ─────────────────────────────────────────────
union (deduped)          → booking.add_poojaorder
                           booking.view_poojaorder
                           rbac.cancel_counter_sale
                           rbac.manage_pooja_orders
                           rbac.operate_counter
```

Response is the §4.2 shape plus a summary of what moved:

```jsonc
{
  "role": { "id": 7, "name": "counter_lead", "label": "Counter Lead" },
  "modules": { "...": "as §4.2" },
  "granted": ["booking.view_poojaorder", "rbac.manage_pooja_orders"],
  "revoked": ["booking.view_agentcode"],
  "unmapped_permissions": []
}
```

> **`PUT` revokes unmapped permissions too**, since it is a full replace and the
> module map is the complete statement of intent. If that is not wanted, use
> `PATCH`. The UI should warn when `unmapped_permissions` is non-empty and the
> operator is about to `PUT`.

### 4.4 `PATCH` — add and remove

For toggling one checkbox without resending everything. Untouched capabilities and
unmapped permissions are left exactly as they are.

```jsonc
// PATCH /api/rbac/roles/7/modules/
{
  "grant":  { "store_orders": ["read"] },
  "revoke": { "counter_bookings": ["cancel"] }
}
```

Response shape matches §4.3.

**Revoke is subtractive, not literal.** Revoking a capability removes only the
permissions that no *still-granted* capability needs. Revoking
`counter_bookings.cancel` drops `rbac.cancel_counter_sale`; revoking
`counter_bookings.create` while `read` is still granted drops
`booking.add_poojaorder` but **keeps** `rbac.operate_counter`, because `read` needs
it too.

```
before:  read ✅  create ✅        → operate_counter, add_poojaorder
revoke create
after:   read ✅  create ✗        → operate_counter
                                     (add_poojaorder dropped; operate_counter kept)
```

Getting this wrong — revoking every permission the capability names — silently
strips `read` as collateral. It is the single most likely bug in this feature, and
the backend test suite pins this specifically.

### 4.5 Errors

| Condition | Status | Body |
|---|---|---|
| Unknown module or capability key | `400` | `{"detail": "Unknown capability 'counter_bookings.approve'."}` |
| Role is a system role | `400` | `{"detail": "'manager' is a built-in role; edit rbac/roles.py and run `manage.py sync_rbac` instead."}` |
| Caller lacks `rbac.manage_roles` | `403` | standard RBAC denial |

System roles are refused by `set_role_permissions` already; the grant API surfaces
that error rather than inventing its own. **Validate the whole payload before
writing anything** — a partially-applied grant leaves a role in a state the operator
never asked for.

### 4.6 Worked example — "Counter Lead"

A role for a senior clerk: runs the desk, may void a sale, may read pooja orders
but not touch them.

```jsonc
// POST /api/rbac/roles/
{
  "name": "counter_lead",
  "label": "Counter Lead",
  "description": "Runs the counter desk and may void a sale.",
  "modules": {
    "counter_bookings": ["read", "create", "cancel", "collect_payment"],
    "pooja_orders": ["read"]
  }
}
```

Expands to six permissions. Assign it with the existing
`POST /api/rbac/roles/{id}/assign/` — role assignment is unchanged, since module
grants shape what a role *is*, not who holds it.

A user holding Counter Lead then resolves, through §3.2, to
`counter_bookings.cancel: true` — the same capability the admin ticked. That
round-trip is the point of using one map for both directions.

---

---

## 5. Quick reference

### Capability keys by module

Every key you can expect. Absent keys are a backend bug, not `false`.

| Module | Capabilities |
|---|---|
| `dashboard` | `read` |
| `pooja_orders` | `read` `create` `update` `delete` `refund` `export` |
| `counter_bookings` | `read` `create` `cancel` `collect_payment` |
| `bookings_execution` | `read` `complete` `assign` |
| `pooja_catalogue` | `read` `create` `update` `delete` |
| `store_orders` | `read` `create` `update` `refund` `export` |
| `store_products` | `read` `create` `update` `delete` |
| `stock` | `read` `update` |
| `poojaris` | `read` `create` `update` `delete` `register` `activate` `export` |
| `notifications` | `read` `create` `update` `delete` `send` `statistics` |
| `users` | `read` `create` `update` `delete` |
| `roles` | `read` `create` `update` `delete` `assign` |
| `songs` | `read` `create` `update` `delete` |

Note the modules with **no** `update` or `delete`: a counter sale is never edited
(voiding is `cancel`), and a store order is never deleted. Do not render those
buttons.

### Guarantees you may code against

- Every module and every capability above is present on every response, for every
  user. All-`false` rather than omitted — no `hasOwnProperty` checks.
- Values are strictly `true` / `false`. Never `null`, never a permission list.
- `is_superuser: true` ⇒ every capability `true`.
- Module and capability keys are stable. `label` is display text and may change.
- Declaration order is meaningful — render modules in the order received.

### Things that will bite

| | |
|---|---|
| `read: true` ≠ "show the nav item" | Some roles can hit an endpoint they have no business seeing. Combine with admin-portal access — §3.3 |
| Revoking a capability may keep permissions | Capabilities share permissions. Re-read after any write rather than predicting the new state — §4.4 |
| `PUT` drops permissions granted outside the editor | Warn when `unmapped_permissions` is non-empty — §4.2, §4.3 |
| A `true` capability can still 403 on one row | Per-row scoping the flags cannot express — §1.2 |

### Migration

`modules` ships **alongside** `permissions` / `effective_permissions`. Nothing is
removed, so you can migrate one screen at a time and keep the raw list for a debug
view.
