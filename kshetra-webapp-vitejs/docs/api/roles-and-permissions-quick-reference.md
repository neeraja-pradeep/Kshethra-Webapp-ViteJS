# Roles & Permissions API — Quick Reference

Base URL (dev): `http://localhost:8010`
Prefix: `/api/rbac/`
Auth/CSRF: see `temple-app-auth-permissions-quick-reference.md` §1–2.

Lets an admin create a role (e.g. "Temple Staff"), pick exactly what it may do, and assign it to users — no backend deploy needed.

---

## 1. The model

Every user has a fixed **base role**: `temple_user`, `temple_poojari`, `temple_admin` — decides which sign-in endpoint accepts them.

On top, they can hold any number of **custom roles**. Permissions are the **union** — assigning a role never removes anything.

```
base_role      = "temple_user"        (unchanged by assignment)
assigned_roles = ["temple_staff"]
permissions    = temple_user perms + temple_staff perms
```

| | `is_system: true` | `is_system: false` |
|---|---|---|
| Which | `temple_admin`, `temple_user`, `temple_poojari` | Anything you create |
| Editable / Deletable | No — `400` | Yes |
| Assignable as an extra role | No — `400` | Yes |

---

## 2. Who can call these endpoints

| Permission | Allows |
|---|---|
| `rbac.manage_roles` | Create/edit/delete roles, read the permission catalogue |
| `rbac.assign_roles` | List roles/users, assign/unassign |

Kept separate on purpose — assigning an existing role is weaker than deciding what a role does. Both held by `temple_admin`. Anything not allowed → `403`, except `GET rbac/me/permissions/`, which any signed-in user may call.

---

## 3. Endpoints

| Method | Path | Needs |
|---|---|---|
| `GET` | `permissions/` | `manage_roles` |
| `GET` / `POST` | `roles/` | `assign_roles` / `manage_roles` |
| `GET` / `PATCH` / `DELETE` | `roles/{id}/` | `assign_roles` / `manage_roles` / `manage_roles` |
| `GET` | `roles/{id}/users/` | `assign_roles` |
| `POST` | `roles/{id}/assign/`, `roles/{id}/unassign/` | `assign_roles` |
| `GET` | `users/`, `users/{id}/` | `assign_roles` + `view_customuser` |
| `POST` | `users/{id}/assign_roles/`, `remove_roles/`, `set_roles/` | `assign_roles` |
| `GET` | `me/permissions/` | any signed-in user |

All bodies JSON. Writes need the CSRF header.

---

## 4. Permission catalogue

**GET** `permissions/` — filters: `search` (name/codename/model), `app_label`

```json
{
  "count": 33,
  "dangerous_permissions": ["rbac.access_all_objects", "rbac.assign_roles", "rbac.manage_roles"],
  "groups": [
    { "app_label": "rbac", "label": "Special actions", "permissions": [
      { "id": 243, "value": "rbac.access_admin_portal", "name": "Can sign in to the admin back office", "is_dangerous": false, "warning": null },
      { "id": 213, "value": "rbac.access_all_objects", "name": "Can access every object regardless of ownership", "is_dangerous": true, "warning": "Removes per-object ownership scoping…" }
    ] }
  ]
}
```

- **`value`** is the identifier sent back in `permissions` — `id` is incidental.
- Render one section per `group.label`; "Special actions" comes first (these separate the back office from the devotee app).
- **`is_dangerous: true` deserves a confirmation step** — show `warning`.
- Django's internal apps are already filtered out.

---

## 5. Roles

**GET** `roles/` — filters: `custom_only=true` (hide the 3 built-ins), `page`/`page_size` (10/page, max 100)
```json
{ "count": 4, "results": [ {
  "id": 1, "name": "temple_admin", "label": "Temple Admin", "is_system": true,
  "is_editable": false, "is_active": true, "permissions": ["..."],
  "permission_count": 127, "user_count": 1, "created_at": "…" } ] }
```

**POST** `roles/`
```json
{
  "name": "temple_staff", "label": "Temple Staff", "description": "Back office desk staff.",
  "permissions": ["rbac.access_admin_portal", "rbac.manage_pooja_orders", "booking.view_poojaorder"],
  "is_active": true
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | lowercase letters/digits/underscores, starts with a letter — **permanent** |
| `label` | yes | free text, shown in UI |
| `description` | no | free text |
| `permissions` | no | `value` strings; omitted = empty role |
| `is_active` | no | default `true`; inactive roles can't be assigned |

**Errors:** `400` malformed/taken/reserved `name`; `400` unknown permission (whole request rejected, nothing created); `403` without `manage_roles`.

**GET** `roles/{id}/` — same object, `user_count` = holders.

**PATCH** `roles/{id}/` — send only what changes; `name` is ignored (fixed at creation).
```json
{ "label": "Front Desk", "permissions": ["rbac.access_admin_portal"] }
```
⚠️ **`permissions` replaces the whole set, doesn't merge** — to add one, resend the full list. Omit the field to leave permissions alone. Changes apply on the holder's **next request**, no re-login needed.
Errors: `400` if built-in, `400` unknown permission, `403` without `manage_roles`.

**DELETE** `roles/{id}/` — deletes and revokes from everyone; their base role is untouched.
`200`: `{ "detail": "Role deleted and revoked from 3 user(s)." }`
`409` if still assigned:
```json
{ "detail": "'Temple Staff' is still assigned to 3 user(s). Re-send with ?force=true …", "user_count": 3 }
```
Confirm, then retry with `?force=true`. `400` if built-in — never deletable, force or not.

**GET** `roles/{id}/users/` — paginated holders (§6 shape).

---

## 6. Users

**GET** `users/` — filters: `search` (username/email/phone), `base_role`, `role` (custom role name)
```json
{ "count": 1, "results": [ {
  "id": 42, "username": "priya", "email": "…", "base_role": "temple_user",
  "assigned_roles": [ { "id": 5, "name": "temple_staff", "label": "Temple Staff", "is_active": true } ],
  "is_active": true, "is_superuser": false, "created_at": "…" } ] }
```
`assigned_roles` = custom roles only — base role is in `base_role`.

**GET** `users/{id}/` — same, plus the flattened resolved set:
```json
{ "id": 42, "base_role": "temple_user", "assigned_roles": ["..."],
  "effective_permissions": ["booking.add_poojaorder", "rbac.manage_pooja_orders", "..."] }
```

### Changing a user's roles

| Endpoint | Effect |
|---|---|
| `POST users/{id}/assign_roles/` | Adds, keeps existing, idempotent |
| `POST users/{id}/remove_roles/` | Removes the ones listed |
| `POST users/{id}/set_roles/` | Replaces the whole set; `[]` clears it |

Request (all three): `{ "role_ids": [5, 7] }` — returns the updated `GET users/{id}/` shape.
`set_roles` also reports the delta: `{ "added": ["temple_desk"], "removed": ["temple_staff"], ... }`.

**Errors:** `400` role id is built-in (follows `base_role`, can't be an extra); `400` role `is_active: false`; `400` unknown role id; `403` without `assign_roles`; `404` unknown user id.

### Bulk, from the role side

```
POST roles/{id}/assign/     { "user_ids": [42, 43] }
POST roles/{id}/unassign/   { "user_ids": [42] }
```
`200`: `{ "detail": "'Temple Staff' assigned to 2 user(s).", "role": "temple_staff", "user_ids": [42,43] }`

---

## 7. What the current user can do

**GET** `me/permissions/` — any signed-in user. Call after login and drive the UI from it.
```json
{ "id": 42, "username": "priya", "base_role": "temple_user", "is_superuser": false,
  "roles": [ { "id": 5, "name": "temple_staff", "label": "Temple Staff" } ],
  "permissions": ["booking.view_poojaorder", "rbac.access_admin_portal", "rbac.manage_pooja_orders", "rbac.view_shop"] }
```
Build menus from `permissions`, not `base_role` — a staff member's `base_role` is still `temple_user`.
```js
const can = (perm) => me.permissions.includes(perm);
if (can("rbac.manage_pooja_orders")) showOrdersMenu();
```
`is_superuser: true` already has every permission listed — no special-casing needed.

---

## 8. Admin portal sign-in

`POST auth/admin-signin/` admits anyone holding **`rbac.access_admin_portal`**, not just `temple_admin`. A custom back-office role **must include this permission** or its holders get `403` at login even with everything else correct — the most common setup mistake.

Response still reports `base_role`: `{ "user": { "id": 42, "username": "priya", "role": "temple_user" } }` — expected for staff; check `me/permissions/` for what they can actually do.

---

## 9. Worked example — creating "Temple Staff"

```js
const catalogue = await api.get("/api/rbac/permissions/");

const role = await api.post("/api/rbac/roles/", {
  name: "temple_staff", label: "Temple Staff",
  description: "Handles bookings at the front desk.",
  permissions: ["rbac.access_admin_portal", "rbac.manage_pooja_orders", "booking.view_poojaorder"],
});

await api.post(`/api/rbac/users/42/assign_roles/`, { role_ids: [role.id] });
```
User 42 can now sign in at `admin-signin/` and use the pooja order back office, keeping every devotee permission they already had.

---

## Gotchas

- **Object scoping is separate from role permissions.** `booking.view_poojaorder` opens the orders API, but scoped to owned orders only. To see *everyone's* records a role also needs `rbac.access_all_objects` (flagged dangerous — lifts ownership checks app-wide). For pooja orders specifically, `rbac.manage_pooja_orders` opens the admin viewset instead — usually what you want.
- **`permissions` on PATCH replaces, never merges.**
- **Built-in roles can't be assigned as extras.** To make someone an admin, change `base_role` on the user record, not through this API.
- **Assignments survive profile edits.**
- **`name` is permanent** — only `label` is renameable; treat `label` as the display name everywhere.
- **`403` vs `404`:** `403` = missing permission; `404` on a user/role id = it doesn't exist.
- **Role removal is immediate** on the holder's next request — no re-login needed.

---

## Screen → Endpoint cheat sheet

| Screen | Endpoints |
|---|---|
| Post-login menu gating | `rbac/me/permissions/` |
| Permission catalogue (role builder) | `rbac/permissions/` |
| Roles list | `rbac/roles/` |
| Create / edit role | `rbac/roles/` (POST), `rbac/roles/{id}/` (PATCH) |
| Delete role | `rbac/roles/{id}/` (DELETE, `?force=true` if assigned) |
| Manage role members | `rbac/roles/{id}/users/`, `rbac/roles/{id}/assign/`, `rbac/roles/{id}/unassign/` |
| Users list / detail | `rbac/users/`, `rbac/users/{id}/` |
| Edit one user's roles | `rbac/users/{id}/assign_roles/`, `remove_roles/`, `set_roles/` |
| Admin sign-in | `auth/admin-signin/` (needs `rbac.access_admin_portal`) |
