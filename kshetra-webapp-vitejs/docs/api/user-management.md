# Staff accounts & roles

How the temple back office is staffed: the seven roles, what each one may do,
and the API behind the **Add team member** screen.

Related: [`roles-and-permissions.md`](roles-and-permissions.md) (full request /
response reference), [`../../rbac/README.md`](../../rbac/README.md) (how the
permission layer works internally).

---

> **Staff accounts only.** Devotees — the app's own sign-ups — are not managed
> here and never appear in `/api/rbac/users/`. Their screen is
> [apps_devotees.md](apps_devotees.md).

## 1. The model in one paragraph

Every user has exactly **one base role**, stored on `CustomUser.role`. The role
is the whole of their access: picking *Counter Staff* grants the counter
permissions and nothing else, and switching them to *Store Staff* later revokes
the counter permissions in the same operation. There is no per-user permission
tick-list to maintain — the admin picks a role, and the role decides everything.

Roles are defined in code (`rbac/roles.py`), not in the database. Adding one is
a deploy, on purpose: see [§7](#7-adding-a-new-role).

```
Admin picks "Counter Staff"
        │
        ▼
CustomUser.role = "counter_staff"
        │  (post_save signal, automatic)
        ▼
User joins the "counter_staff" Django Group
        │
        ▼
user.has_perm("rbac.operate_counter") → True
user.has_perm("rbac.refund_pooja_order") → False
```

---

## 2. The seven roles

These are exactly the options in the **Assigned role** dropdown, in order.
Fetch them from `GET /api/rbac/users/assignable-roles/` rather than hardcoding.

| Role | `name` | What it is for |
|---|---|---|
| **Admin** | `temple_admin` | Everything, including staffing the team. |
| **Manager** | `manager` | The whole back office *except* creating users and roles. |
| **App Manager** | `app_manager` | App content — poojas, products, songs, notifications. Never touches money. |
| **Reports Manager** | `reports_manager` | Read-only across the back office, plus every CSV export. |
| **Counter Staff** | `counter_staff` | The walk-in desk: take bookings, collect agent-code payments. |
| **Store Staff** | `store_staff` | The shop: orders, stock, catalogue, refunds. |
| **Poojari** | `temple_poojari` | The poojari app: only the bookings assigned to them. |

**Devotee** (`temple_user`) is deliberately *not* in the dropdown — devotees get
that role by signing up in the app. An operator never assigns it.

---

## 3. Capability matrix

Generated from `rbac/roles.py`; regenerate rather than hand-edit if roles change.

| Capability | Admin | Manager | App Manager | Reports Manager | Counter Staff | Store Staff | Poojari | Devotee |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Sign in to back office | Yes | Yes | Yes | Yes | Yes | Yes | — | — |
| See all records (not just own) | Yes | Yes | Yes | Yes | Yes | Yes | — | — |
| Create / edit staff accounts | Yes | — | — | — | — | — | — | — |
| Create / assign roles | Yes | — | — | — | — | — | — | — |
| Admin dashboard | Yes | Yes | Yes | Yes | — | — | — | — |
| Business metrics | Yes | Yes | — | Yes | — | — | — | — |
| Open pooja order screens | Yes | Yes | — | Yes ᴿ | — | — | — | — |
| Refund pooja order | Yes | Yes | — | — | — | — | — | — |
| Counter: take booking | Yes | Yes | — | — | Yes | — | — | — |
| Counter: collect payment | Yes | Yes | — | — | Yes | — | — | — |
| Counter: void sale | Yes | Yes | — | — | — | — | — | — |
| Edit pooja catalogue | Yes | Yes | Yes | — | — | — | — | — |
| Edit shop catalogue | Yes | Yes | Yes | — | — | Yes | — | — |
| Manage shop orders | Yes | Yes | — | — | — | Yes | — | — |
| Refund shop order | Yes | Yes | — | — | — | Yes | — | — |
| Manage stock | Yes | Yes | — | — | — | Yes | — | — |
| Manage songs | Yes | Yes | Yes | — | — | — | — | — |
| Send notifications | Yes | Yes | Yes | — | — | — | — | — |
| Open the Devotees screen | Yes | Yes | Yes | Yes ᴿ | — | — | — | — |
| Suspend a devotee account | Yes | Yes | Yes | — | — | — | — | — |
| Open poojari screens | Yes | Yes | — | Yes ᴿ | — | — | — | — |
| Assign poojari to a booking | Yes | Yes | — | — | — | — | — | — |
| Export pooja orders (CSV) | Yes | Yes | — | Yes | — | — | — | — |
| Export shop orders (CSV) | Yes | Yes | — | Yes | — | Yes | — | — |
| Poojari: own assignments | — | — | — | — | — | — | Yes | — |

**ᴿ = read only.** Reports Manager holds the *scope* permission that opens the
screen but no `add`/`change`/`delete` permission on any model, so every write
action on it returns `403`. This is asserted by
`rbac.tests.StaffRolePermissionTests.test_reports_manager_holds_no_model_write_permission`.

### Design notes

* **Manager is derived from Admin in code** — `MANAGER_PERMISSIONS` is literally
  `TEMPLE_ADMIN_PERMISSIONS` minus `{manage_roles, assign_roles, manage_users,
  add_customuser, change_customuser}`. Anything granted to Admin later reaches
  Manager automatically; the two cannot silently drift.
* **Only Admin staffs the team.** `manage_users`, `manage_roles` and
  `assign_roles` are each a route to becoming an Admin, so all three are held by
  Admin alone.
* **Counter Staff cannot reverse money.** Taking a payment and voiding one are
  deliberately a step apart — voids and refunds escalate to Manager or Admin.
* **App Manager holds no order permission at all**, so no amount of catalogue
  editing reaches a booking, a payment or a refund.

---

## 4. The Add team member screen

### Populate the dropdown

```http
GET /api/rbac/users/assignable-roles/
```

```json
[
  { "name": "temple_admin", "label": "Admin",         "description": "Full back office access. ..." },
  { "name": "manager",      "label": "Manager",       "description": "Full back office - orders, ..." },
  { "name": "app_manager",  "label": "App Manager",   "description": "App content: poojas, ..." }
]
```

Render `label` as the option text and `description` as the helper line under
the dropdown. Send `name` back as `role`.

### Create the account

```http
POST /api/rbac/users/
```

```json
{
  "username": "desk-clerk",
  "password": "a-strong-password",
  "role": "counter_staff",
  "email": "clerk@temple.test",
  "phone_number": "9000000001",
  "first_name": "Desk",
  "last_name": "Clerk"
}
```

| Field | Required | Notes |
|---|---|---|
| `username` | yes | Sign-in identifier. **Cannot be changed later.** |
| `password` | yes | Checked against Django's validators. Never returned. |
| `role` | yes | One of `assignable-roles`. Anything else → `400`. |
| `email` | no | Unique if given. |
| `phone_number` | no | Unique if given. Blank is stored as `null`, so several accounts may omit it. |
| `first_name`, `last_name` | no | |
| `is_active` | no | Defaults to `true`. |
| `employee_id` | no | **Poojari only.** Sent for any other role → `400`. Generated when omitted. |

**`201`** returns the created user; the account can sign in at
`/api/auth/admin-signin/` immediately (Poojari uses `/api/auth/poojari-signin/`).

### Errors to surface

| Response | Meaning |
|---|---|
| `{"username": ["A user with that username already exists."]}` | Pick another username |
| `{"email": ["This email is already registered."]}` | Email in use |
| `{"password": ["This password is too short. ...", "This password is too common."]}` | Show every string in the list |
| `{"role": ["\"temple_user\" is not a valid choice."]}` | Role not assignable from this screen |
| `{"employee_id": ["Only a Poojari account has an employee id."]}` | Hide the field unless Poojari is selected |
| `403` | The signed-in user is not an Admin |

---

## 5. Managing an existing account

| Action | Request |
|---|---|
| Change role | `PATCH /api/rbac/users/{id}/` `{"role": "store_staff"}` |
| Edit contact details | `PATCH /api/rbac/users/{id}/` `{"email": "...", "first_name": "..."}` |
| Deactivate | `DELETE /api/rbac/users/{id}/` |
| Reactivate | `POST /api/rbac/users/{id}/activate/` |
| Reset password | `POST /api/rbac/users/{id}/set-password/` `{"password": "..."}` |

All of them return the updated user, so the row can be re-rendered without a
second request.

### DELETE deactivates — it does not delete

The row is kept and `is_active` becomes `false`. A clerk who took counter
payments stays attributable, so their receipts and orders are never orphaned or
cascade-deleted. Sessions they already hold stop working on their **next
request** (`ModelBackend.get_user` re-checks `is_active`), so there is no need
to log them out separately.

### Guard rails

These return **`400`** with a readable `detail`, not `403`:

| Attempt | Message |
|---|---|
| Deactivating your own account | `You cannot deactivate your own account.` |
| Changing your own role | `You cannot change the role on your own account.` |
| Modifying a superuser when you are not one | `Only a superuser may modify a superuser account.` |

### Poojari accounts

Creating or promoting someone to **Poojari** also creates their
`PoojariProfile` (with `employee_id`, `status: "active"`). Without it the
poojari app cannot render them at all, so this is automatic — you do not need
to call the older `RegisterPoojariView`.

---

## 6. Shrines: which gods a poojari serves

A poojari account can be narrowed to the **gods** (pooja categories) whose
shrine they keep. The temple's poojaris are not interchangeable — one keeps
Ganapathi, another Devi — and this list is what turns their app from "everything
happening today" into "everything happening today at my shrine".

Stored as `PoojariGod` rows against the **user**, not the profile: a booking is
assigned to a user, and a poojari without an `employee_id` yet still has work.

### The two endpoints

| Who | Endpoint | Action permission |
|---|---|---|
| Back office, for anybody | `GET /api/admin/poojaris/{id}/gods/` | `rbac.manage_poojaris` |
| | `PUT /api/admin/poojaris/{id}/gods/` | `rbac.manage_poojari_gods` |
| A poojari, for themselves | `GET` `PUT` `/api/poojari/gods/` | `rbac.assign_own_gods` |

Each also requires the matching model permissions on `PoojariGod` — `view` to
read, `add` + `delete` to replace (the list is replaced wholesale, so a save
adds and drops rows but never changes one). Admin and Manager hold the
back-office pair; Poojari holds `assign_own_gods` and its own three. Reports
Manager holds `manage_poojaris` + `view_poojarigod` only, so it can **read** a
poojari's shrine list and not change it — consistent with its read-only shape.

Both take the **whole list**, replaced:

```json
PUT /api/admin/poojaris/42/gods/
{ "god_ids": [3, 7] }
```

Two separate permissions on purpose. The poojari endpoint has no id anywhere in
it, so `assign_own_gods` can only ever act on the holder; choosing *another*
person's shrine is a different act — it decides someone else's workload — and is
`manage_poojari_gods`.

`assigned_by` records who made the assignment, and is **null when the poojari
chose it themselves** — a row naming them as their own assigner would read as if
somebody had rostered them.

### Only poojaris can be given gods

The target must be an account the temple would call a poojari: `role ==
"temple_poojari"` **or** one carrying a `PoojariProfile` (see
`temple_poojari.services.poojari_queryset`). The two are ORed because an account
could have had one without the other since before these screens existed.

Pointing the admin endpoint at any other account — a devotee, a clerk —
returns **404**. An unknown category id returns **400**
(`No such pooja category: [...]`).

### An empty list means "no shrine of my own"

This is the part worth getting right: **no gods assigned is not "sees nothing",
it is "sees everything"**. `assigned_god_ids()` returns `None` rather than an
empty set for an unassigned poojari, and the views read `None` as *no scoping
applies*.

That is deliberate. Every poojari was unscoped before this table existed, and
returning an empty set for them would have blanked the booking screen of every
poojari in the temple the day it shipped. Assigning the first god is what
switches scoping **on** for that person; clearing the list switches it back off.

### What the scoping actually does

Once the list is non-empty, four endpoints narrow to it — they all read the same
`assigned_god_ids()`, so they cannot disagree:

| Endpoint | Scoped by the shrine list |
|---|---|
| `/api/poojari/pooja-management/` | The booking list, and the `PATCH` that updates status |
| `/api/poojari/pooja-stats/` | One row per shrine kept |
| `/api/poojari/upcoming-pooja-counts/` | The home screen's day tiles |

`category_id` behaves differently either side of that switch:

- **Scoped poojari, no `category_id`** — every shrine they keep, in one list.
  This is the app's "All" tab.
- **Scoped poojari, `category_id` they do not serve** — **403**, *"That god is
  not one of the gods you serve"*. Deliberately not an empty `200`: an empty
  list reads as "nothing on today", and the poojari would wait at a shrine that
  was never going to give them work.
- **Unscoped poojari, no `category_id`** — **400**, `category_id is required`.
  There is no honest default; it would be the whole temple's day.
- **Unscoped poojari, with `category_id`** — served, any god.

### Verified behaviour

Checked live against a seeded database, and covered by
`temple_poojari/test_gods.py` and `test_assigned_work.py` (42 tests):

| Action | Result |
|---|---|
| Admin `PUT` gods on a poojari | `200`, `assigned_by` = the admin |
| Poojari `PUT` their own gods | `200`, `assigned_by` = `null` |
| Admin `PUT` gods on a devotee | `404` |
| Unknown god id | `400` |
| Poojari keeping Ganapathi + Devi | Both shrines' bookings listed |
| Drop Devi from the list | Devi's bookings disappear; Ganapathi's remain |
| Ask for a shrine not theirs | `403` |
| Clear the list entirely | Back to unscoped — every god, `category_id` required |

---

## 7. Adding a new role

Deliberately a code change, not a UI feature. The client asks the production
team; the production team does this:

1. **`rbac/constants.py`** — add a `ROLE_*` constant, list it in `STAFF_ROLES`
   at the position it should appear in the dropdown, and add a `ROLE_LABELS`
   and `ROLE_DESCRIPTIONS` entry.
2. **`rbac/roles.py`** — declare its permission list and register it in
   `ROLE_PERMISSIONS`.
3. **`python manage.py makemigrations authentication`** — `CustomUser.role`
   builds its choices from `ALL_ROLES`, so the new role appears automatically.
4. **`python manage.py migrate && python manage.py sync_rbac`**.

`sync_rbac` is idempotent and is the deploy step for *any* change to
`rbac/roles.py`. Verify with `python manage.py rbac_audit`, which reports
unmapped views, permissions that do not exist, and permissions no role holds.

The runtime custom-role API (`POST /api/rbac/roles/`) still exists for one-off
roles layered on top of a base role, but the admin UI does not expose it.

---

## 8. Deploying this change

```bash
python manage.py migrate
python manage.py sync_rbac
```

`sync_rbac` creates the eight groups and pushes their permissions. Existing
users are unaffected: `temple_admin`, `temple_poojari` and `temple_user` keep
the permissions they had.

Expected output:

```
Roles
  temple_admin      137 permissions
  manager           132 permissions
  app_manager        59 permissions
  reports_manager    41 permissions
  counter_staff      28 permissions
  store_staff        49 permissions
  temple_poojari     27 permissions
  temple_user        59 permissions
```

---

## 9. A trap worth knowing about

Permission checks and **querysets** are two different layers. The permission map
decides whether a request is allowed; the view's `get_queryset` decides which
rows come back. A role can pass the first and be handed an empty list by the
second.

Several querysets used to branch on `user.role == 'temple_admin'`, which meant
every role added later got a `200` with **no rows** — Store Staff saw no shop
orders, App Manager saw no categories. They now key on the
`rbac.access_all_objects` permission instead, so a new role works without those
views knowing it exists.

**When adding a role, grep for hardcoded role names**, not just for permissions:

```bash
grep -rnE "role.*==\s*['\"]temple_" --include=*.py .
```

`rbac/test_data_scoping.py` guards the row-level half of this and will fail if
it regresses.

---

## 10. Where things live

| Concern | File |
|---|---|
| Role names, labels, descriptions, dropdown order | `rbac/constants.py` |
| What each role may do | `rbac/roles.py` |
| Which permission each endpoint needs | `rbac/permission_map.py` |
| Account create / update / deactivate logic | `rbac/services.py` |
| The endpoints | `rbac/views.py` (`UserRoleViewSet`) |
| Role boundary tests | `rbac/tests.py` (`StaffRolePermissionTests`) |
| Endpoint tests | `rbac/test_role_api.py` (`StaffUserCrudAPITests`) |
| Row-visibility tests | `rbac/test_data_scoping.py` |
| A poojari's shrine list (model + scoping rule) | `temple_poojari/models.py` (`PoojariGod`, `assigned_god_ids`) |
| Shrine assignment endpoints | `temple_admin/poojari_views.py`, `temple_poojari/views.py` |
| Shrine tests | `temple_poojari/test_gods.py`, `test_assigned_work.py` |
