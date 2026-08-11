# Roles & Permissions — Unbuilt UI Backlog

Everything the RBAC backend supports that the console does not expose, tracked as a checklist.

Contract: [roles-and-permissions-quick-reference.md](roles-and-permissions-quick-reference.md). Analysis and the phased plan: [roles-and-permissions-gaps.md](roles-and-permissions-gaps.md). This file is the inventory — one line per capability, so nothing is lost between phases.

Status legend: ✅ built · 🟡 partial · ❌ nothing.

**Data column** = client repository, schema and query/mutation hook exist. **UI column** = a screen a user can actually reach. Phase 2 filled the data column for every endpoint below; nothing in the UI column moved.

---

## 1. Endpoints

| Endpoint | Needs | Data | UI | Notes |
|---|---|---|---|---|
| `GET rbac/me/permissions/` | any signed-in | ✅ | ✅ | Gating, route guards, account menu |
| `GET rbac/permissions/` | `manage_roles` | ✅ | ❌ | `usePermissionCatalogueQuery` — no catalogue screen |
| `GET rbac/roles/` | `assign_roles` | ✅ | 🟡 | Feeds the role filter and the assignment editor — no roles *screen* |
| `POST rbac/roles/` | `manage_roles` | ✅ | ❌ | `useCreateRoleMutation` — no role builder |
| `GET rbac/roles/{id}/` | `assign_roles` | ✅ | ❌ | `useRoleQuery` |
| `PATCH rbac/roles/{id}/` | `manage_roles` | ✅ | ❌ | `useUpdateRoleMutation` |
| `DELETE rbac/roles/{id}/` | `manage_roles` | ✅ | ❌ | `useDeleteRoleMutation`, incl. the `409` → `force` outcome |
| `GET rbac/roles/{id}/users/` | `assign_roles` | ✅ | ❌ | `useRoleUsersQuery` |
| `POST rbac/roles/{id}/assign/` | `assign_roles` | ✅ | ❌ | `useAssignRoleToUsersMutation` |
| `POST rbac/roles/{id}/unassign/` | `assign_roles` | ✅ | ❌ | `useUnassignRoleFromUsersMutation` |
| `GET rbac/users/` | `assign_roles` + `view_customuser` | ✅ | ✅ | Users list — server search, role/base-role filters, pagination |
| `GET rbac/users/{id}/` | `assign_roles` + `view_customuser` | ✅ | ✅ | User detail — identity, roles, effective permissions |
| `POST rbac/users/{id}/assign_roles/` | `assign_roles` | ✅ | ❌ | |
| `POST rbac/users/{id}/remove_roles/` | `assign_roles` | ✅ | ❌ | |
| `POST rbac/users/{id}/set_roles/` | `assign_roles` | ✅ | ✅ | Role editor (multi-select); the delta drives the toast |
| `POST auth/admin-signin/` | `access_admin_portal` | ✅ | ✅ | |

**16 of 16 have a data layer; 5 of 16 have a UI.** Every endpoint is declared in `RBAC_ENDPOINTS`, schema-validated against the live server, and reachable through a hook. The gap is now entirely presentational.

---

## 2. Permission catalogue — nothing renders it

`GET rbac/permissions/` is the whole basis of the role builder and has no client surface at all.

- [ ] Render the catalogue, one section per `group.label`, **"Special actions" first** — `orderedGroups()` already sorts them
- [ ] `search` filter (matches name / codename / model — all three are on the `Permission` entity)
- [ ] `app_label` filter
- [ ] `is_dangerous` badge on the ~3 flagged permissions
- [ ] **Confirmation step before granting a dangerous permission, showing the server's `warning` text** (§4 of the contract)
- [ ] Show `dangerous_permissions` as a summary on the role being built

`PERMISSIONS` in `features/auth/application/hooks/permissions.ts` lists 12 codenames against a live catalogue of **193** in 9 groups. It is the gating vocabulary and should stay hardcoded; **the builder must read the live catalogue** — the two are different jobs. `usePermissionCatalogueQuery` already fetches and validates it, holding it for 30 minutes since new permissions only appear on a backend deploy.

---

## 3. Role fields with no UI

| Field | Meaning | UI |
|---|---|---|
| `id` (number) | server identity | ❌ client roles are string ids |
| `name` | immutable, `^[a-z][a-z0-9_]*$`, **permanent** | ❌ no create form, no permanence hint |
| `label` | the display name, renameable | 🟡 mock roles have `label`, not server-backed |
| `description` | free text | ❌ nothing captures or shows it |
| `permissions` | codename list | ❌ mock uses display-string `modules` instead |
| `permission_count` | | ❌ |
| `user_count` | holders | ❌ |
| `is_system` | built-ins: not editable, deletable or assignable | ❌ nothing distinguishes them |
| `is_editable` | | ❌ |
| `is_active` | **inactive roles cannot be assigned** | ❌ no toggle, no filter, no explanation on failure |
| `created_at` | | ❌ |

- [ ] `custom_only=true` filter (hide the 3 built-ins)
- [x] Server pagination (page + page size) (`page` / `page_size`, 10 default, 100 max) — the mock screen paginates client-side over a fixed array

---

## 4. Contract behaviours with no handling

- [x] **`409` on delete → confirm → retry with `?force=true`.** The repository turns the `409` into a `DeleteRoleOutcome` of `{ kind: 'stillAssigned', userCount }` rather than an error, because it is the server asking a question the user must answer. **Verified end to end against the live server.** The confirm dialog itself is UI work and remains.
- [x] **`PATCH permissions` replaces, never merges.** `toUpdateRoleRequest` sends only keys the caller actually set, so an omitted `permissions` stays omitted while an explicit `[]` still clears. Confirmed live: patching with one permission left the role holding exactly one. The editor must still submit the full resulting set.
- [ ] **Built-in roles reject edit / delete / assign with `400`.** Disable the controls off `is_system` / `is_editable` rather than letting the error explain it.
- [ ] **`400` on assigning an inactive role** — needs its own message, not "something went wrong".
- [ ] **Unknown permission rejects the whole request** — nothing is created. The builder should say so rather than implying a partial save.
- [ ] **`403` vs `404`** — `mapHttpError` already separates these; the RBAC screens should say "you don't have permission" vs "that role is gone".
- [x] **Role changes apply on the holder's next request, no re-login.** `useRbacInvalidation` refreshes `rbacKeys.all` *and* `authKeys.session()`; all 8 mutation hooks use it, so an admin editing their own roles sees the nav update immediately instead of after the 5-minute session staleness window.
- [ ] **§8's most common setup mistake:** a back-office role without `rbac.access_admin_portal` gets `403` at login with everything else correct. The builder should warn when a role grants console permissions but omits it.

---

## 5. User fields with no UI

| Field | UI |
|---|---|
| `base_role` | ✅ — its own column and badge, separate from assigned roles |
| `assigned_roles[]` (additive, N per user) | ✅ — multi-select editor; saving replaces the whole set |
| `effective_permissions` (from `users/{id}/`) | ✅ — `EffectivePermissionsPanel`, grouped by app label |
| `is_superuser` | ✅ — noted on the detail card |
| `is_active` | 🟡 drawn as Active/Inactive, **but no endpoint here flips it** |
| `phone_number` | ✅ — **is returned**, contrary to the contract doc; shown in the table and detail |
| `created_at` | ✅ |

- [x] `search` filter (username / email / phone) — debounced, server-side
- [x] `base_role` filter
- [x] `role` filter (by custom role name)
- [x] Server pagination (page + page size)
- [x] `set_roles` returns an `added` / `removed` delta — it drives the confirmation toast

⚠️ **Blocked, not merely unbuilt:** the screen draws **Add user, Edit, Deactivate, Reactivate, Delete** and the RBAC API has **no `POST` / `PATCH` / `DELETE` on users** — it is read + role-assignment only. `name`, `avatar`, `createdBy` / `modifiedBy`, `activity`, `metrics` and `gods` have no source either. Needs a backend answer before that half can be finished; see §G of the gaps doc.

⚠️ **Out of scope by design:** making someone an admin means changing `base_role` on the user record — built-in roles can't be assigned as extras. Not doable through this API at all, so the UI must not offer it.

---

## 5b. Drawn, but no backend exists — removed from the wired screen

The Users & Roles screen was integrated with `rbac/users/` in full. These parts of the design were **taken out of the wired screen** rather than left running on mock data beside real data, which would have read as working. Every component below is still on disk, unused, ready for the day an endpoint appears.

| Drawn | Component(s) | Why it is not wired |
|---|---|---|
| **Add user** | list header button, `UserFormView` | No `POST rbac/users/`. Accounts arrive via devotee signup or `temple_admin/register-poojari/` |
| **Edit identity** — name, email, phone, avatar | `UserFormView`, `UserIdentitySection` | No `PATCH rbac/users/{id}/`. The registry is read-only apart from role assignment |
| **Deactivate / Reactivate** | `AccountLifecycleCard` | `is_active` is returned but **no endpoint flips it** |
| **Delete user** | `AccountLifecycleCard`, `ConfirmUserDialog` | No `DELETE rbac/users/{id}/` |
| **Counter / store / poojari activity** | `CounterActivityPanel`, `StoreActivityPanel`, `PoojariActivityPanel`, `UserMetrics` | No metrics on any user endpoint. Every number was prototype fiction |
| **Poojari god assignment** | `PoojariGodsSection`, `GodPickerDropdown`, `gods.mock.ts` | Nothing assigns deities to a poojari. (`gods` in the backend is a **pooja↔category** relation, not a poojari one.) Poojari management lives under `temple_admin/poojaris/` — a separate feature needing its own contract |
| **Module access list** | `ModuleAccessPanel` | Module names were invented by the prototype. Replaced by `EffectivePermissionsPanel`, which renders the server's `effective_permissions` |
| **Status filter** | `UsersFilterBar` | `rbac/users/` **ignores `is_active`** — verified live. Replaced with a base-role filter, which the server does honour |
| **Column sorting** | `SortableColumnHeader` | `rbac/users/` **ignores `ordering`** — verified live. Sorting one page would read as sorting the registry |
| **Active / Inactive KPI tiles** | `buildStatusKpis` | No status counts. The band now shows two real server totals: users, and custom roles |
| **Created by / Last modified by / on** | `UserOverviewCards` | The registry returns `created_at` only. (**Roles** do carry `created_by_username` and `updated_at` — users do not.) |
| **Full name, avatar image** | table, detail, form | Only `username` exists. `Avatar` renders initials from it |

**Two mock files were deleted** — `users.mock.ts` and `roles.mock.ts` — because a fake user list sitting beside a real one is the specific hazard this integration was meant to remove. `gods.mock.ts` is kept: poojari-deity assignment is a real unbuilt feature, not a discarded one.

### To finish the Users screen, the backend needs

- [ ] `POST rbac/users/` — create a staff account
- [ ] `PATCH rbac/users/{id}/` — edit identity, and flip `is_active`
- [ ] `DELETE rbac/users/{id}/`
- [ ] `is_active` and `ordering` query parameters on `GET rbac/users/`
- [ ] A per-user activity/metrics endpoint, if those panels are still wanted
- [ ] A full-name field, if `username` is not the intended display name

---

## 6. Permissions the console defines but never exercises

| Codename | Status |
|---|---|
| `rbac.access_admin_portal` | Declared in `PERMISSIONS`, **never checked** — it is the login gate, enforced server-side at `admin-signin/` |
| `rbac.assign_roles` | **No screen uses it yet** — the assign-but-don't-author persona still has nowhere to go |
| `rbac.access_all_objects` | Unused. One of the 3 the live server flags dangerous (with `rbac.assign_roles` and `rbac.manage_roles`) — only ever granted through the role builder, with the warning |
| `authentication.view_customuser` | Unused until the users list is wired. ⚠️ Was written `auth.view_customuser` following the contract doc; that permission **does not exist** — corrected against the live catalogue |
| `rbac.cancel_counter_sale` | Unreachable — no UI can void a sale. Tracked in [counter-bookings-gaps.md](counter-bookings-gaps.md) §A |

---

## 7. Done

- [x] **Route gating matched to sidebar gating** — every module route now carries the codenames its NAV entry declares, read from `permissionsForPath()` so the two cannot drift. Previously only `/counter` was guarded; `/users-roles`, `/dashboard`, `/pooja-orders` and `/notifications` were hidden from the rail but reachable by URL, rendering mock data as if entitled.
- [x] **Permission-aware landing.** `/` no longer hard-redirects to `/dashboard` — which, once `/dashboard` was gated, would have dropped counter and store staff onto `/no-access` at sign-in. `LandingRedirect` sends each user to their first reachable module.
- [x] **`assignRoles`, `accessAllObjects`, `viewCustomuser`** added to `PERMISSIONS`.
- [x] **Dev-time drift guard** — `permissionsForPath()` warns when a route has no NAV entry, since that route would mount completely ungated and silently.
- [x] **The whole RBAC data layer** (Phase 2) — `features/rbac/`, 28 files: 3 entities, a repository interface and implementation, 6 zod-validated response schemas, 14 usecases, query keys, 6 query hooks and 8 mutation hooks. `paginated` moved to `core/api/wire.ts` so rbac and counter share one definition instead of duplicating it.
- [x] **Users & Roles screen integrated** (Phases 4 + 5, minus what §5b blocks) — the registry is now `rbac/users/`, with server search, role and base-role filters, and pagination. Detail shows the base role, assigned roles and the server-resolved `effective_permissions`. Roles are edited through a **multi-select** backed by `set_roles/`, replacing the design's single-select, which could not express the base-plus-additive model. `RoleBadge` colours are derived from the role's permanent `name`, so server-defined roles render without a deploy and keep their colour as others come and go.
- [x] **Nav gate corrected** — the screen was gated on `manage_roles`, which is the *authoring* permission. Listing users needs `assign_roles` + `authentication.view_customuser`; it now requires those.
- [x] **Contract verified against the live server**, not just typechecked — every read schema parsed against a real payload, and `create → patch → assign → 409 → force delete` exercised with a throwaway role that was then removed. Corrected three things the contract doc got wrong or elided: the `authentication.` app label, the catalogue's real size (193, not 33), and `phone_number` being returned.
