# Roles & Permissions — Gaps Between Backend and UI

An audit of the console's auth/permission layer against [roles-and-permissions-quick-reference.md](roles-and-permissions-quick-reference.md), plus the plan to close it. The per-capability checklist lives in [roles-and-permissions-unbuilt-ui.md](roles-and-permissions-unbuilt-ui.md).

Short version: **the consumption side is done and correct; the administration side does not exist.** (Both halves have since been built — see the phase notes below. §G's "blocker" was a misreading and is corrected there.) The console reads `rbac/me/permissions/` properly and gates on codenames exactly as §7 prescribes. But 8 of the 9 endpoint families in the doc's cheat sheet have no client surface at all, and the Users & Roles screen is a mock built on a role model that contradicts the backend's.

---

## A. What already matches the contract

Worth stating, because it means the mitigation is additive — nothing below needs unwinding.

| Contract | Where | Status |
|---|---|---|
| Session cookies + `withCredentials` | `core/api/http.ts` | ✅ |
| CSRF cookie → `X-CSRFToken` on unsafe methods, refresh-and-retry-once on `403 "CSRF Failed"` | `core/api/csrf.ts`, `http.ts` | ✅ |
| `GET rbac/me/permissions/` as the session probe | `useMyPermissionsQuery.ts` | ✅ |
| Response zod-validated, snake→camel at the boundary | `myPermissions.response.ts` | ✅ |
| Session owned by the query cache, not a store | `useMyPermissionsQuery.ts` | ✅ |
| **Gate on `permissions`, never on `base_role`** (§7) | `useCan.ts`, `nav.ts`, `ProtectedRoute.tsx` | ✅ |
| `is_superuser` bypasses every check | `useCan.ts:18`, `ProtectedRoute.tsx:38` | ✅ |
| `auth/admin-signin/` (not role-specific) | `auth.api.ts:15` | ✅ |
| Session invalidated after sign-in so the guard can't race | `useSignInMutation.ts:17` | ✅ |
| `401` → global unauthorized handler | `http.ts:80` | ✅ |

`nav.ts:36-43` even carries the reasoning verbatim — "a counter operator's base role is still `temple_user`, so role names would hide the console from exactly the people who were granted it." The team read §7 and built to it.

---

## B. The role model in `users-roles/` contradicts the backend's

This is the structural problem, and it is why the fix is a rewrite of that feature rather than a wiring pass.

`domain/entities/role.ts:5-7` states the premise: *"A fixed, predefined role. Roles are not user-editable — module access is baked into the role and shown read-only on the user's detail screen."* The backend's premise is the exact opposite: an admin creates roles, picks their permissions from a live catalogue, and edits them without a deploy.

| Client `Role` | Backend role | Consequence |
|---|---|---|
| `id: string` — `'admin'`, `'counter-staff'` | `id: number` + immutable `name` + renameable `label` | Every id in `users.mock.ts` and `roles.ts` is the wrong type |
| 7 hardcoded entries in `roles.mock.ts` | unbounded, CRUD via `roles/` | The whole catalogue must come from the server |
| `modules: string[]` — display strings (`'Dashboard'`) | `permissions: string[]` — codenames (`'rbac.view_admin_dashboard'`) | No mapping exists in either direction |
| `web: boolean` | holding `rbac.access_admin_portal` | §8's "most common setup mistake" is unrepresentable |
| `kind` — badge colour / which activity panel | no equivalent | Presentation-only; needs a fallback once roles are server-defined |
| — | `is_system`, `is_editable`, `is_active`, `user_count`, `permission_count` | All absent |

### The one that hurts most: one role per user

`User.roleId` is a scalar (`user.ts:28`), the form's role picker is a single `<Select>` (`UserRoleSection.tsx:25`), and `findRole()` returns exactly one (`roles.ts:7`).

The backend gives every user a **fixed `base_role` plus any number of additive `assigned_roles`**, with permissions as the union. There is no single role to show. `UserRoleSection`'s helper text — "Role determines module access. Access is predefined per role" — and `ModuleAccessPanel:32` — "Access is fixed by role and can't be edited here" — are both assertions the backend contradicts.

---

## C. Nothing in `users-roles/` talks to a server

The feature is `domain/` + `presentation/` only — no `application/`, no `infrastructure/`, in a codebase where `counter-pos/` has both. `UsersRolesScreen.tsx:52` seeds `useState` from `USERS` and every mutation is a local array edit: `handleSaveForm` (:283) builds an id with `U-${max+1}`, `handleConfirmYes` (:360) splices the array. `ACTOR = 'Admin'` (:21) is a hardcoded audit trail.

`RBAC_ENDPOINTS` has exactly one entry — `myPermissions`. The other eight families are unrepresented:

| Cheat-sheet row | Endpoint | Client |
|---|---|---|
| Post-login menu gating | `rbac/me/permissions/` | ✅ wired |
| Permission catalogue | `rbac/permissions/` | ❌ none |
| Roles list | `rbac/roles/` | ❌ none |
| Create / edit role | `roles/` POST, `roles/{id}/` PATCH | ❌ none |
| Delete role | `roles/{id}/` DELETE `?force=true` | ❌ none |
| Manage role members | `roles/{id}/users/`, `assign/`, `unassign/` | ❌ none |
| Users list / detail | `rbac/users/`, `users/{id}/` | ❌ mock |
| Edit one user's roles | `assign_roles/`, `remove_roles/`, `set_roles/` | ❌ none |

**There is no role-builder UI at all** — no screen renders a permission catalogue, so nothing in the console can create the "Temple Staff" role §9 walks through.

---

## D. Route gating is weaker than sidebar gating

`nav.ts:78` hides the Users & Roles entry behind `PERMISSIONS.manageRoles`. `routes.tsx:60` mounts it as `{ path: 'users-roles', element: <UsersRolesScreen /> }` — **no `requires`**. Typing the URL renders the screen for any signed-in console user.

`/counter` (`routes.tsx:42`) is the only route with a `requires`. Dashboard, pooja-orders and notifications are hidden in the sidebar but reachable by URL for the same reason.

Not a security hole — the server enforces regardless, and `useCan.ts:8-9` says so correctly — but with the screens still mock-driven, an unpermitted user currently sees **mock data rendered as if it were real**, which is worse than a `403`.

---

## E. `rbac.manage_roles` vs `rbac.assign_roles` isn't modelled

§2 splits these deliberately: assigning an existing role is a weaker act than deciding what a role does. `PERMISSIONS` (`hooks/permissions.ts`) has only `manageRoles`.

So the intended middle persona — a supervisor who can put someone on the front desk but not invent new powers — sees **no Users & Roles entry at all**, and there is no way to render the assign-only variant of the screen (user list + role assignment, with the role builder hidden).

Note the split is per-method on one path: `GET roles/` needs `assign_roles`, `POST roles/` needs `manage_roles`. Gating has to be per-control, not per-screen.

---

## F. The hardcoded `PERMISSIONS` map can't back a role builder

Nine codenames against a catalogue of **193** — the contract doc's `"count": 33` is an illustrative sample, not the real size (verified against the live server). Fine as the gating vocabulary — those are the ones the console itself branches on, and the comment correctly ties them to `rbac/constants.py`. But a role builder must render **every** permission the server knows, grouped by `group.label`, with `is_dangerous` + `warning` surfaced — that can only come from `GET rbac/permissions/` at runtime.

Missing from the constant even for gating purposes: `rbac.assign_roles` (§E), `rbac.access_all_objects`, and `authentication.view_customuser` — note the app label. §3 of the contract writes it `view_customuser` with no prefix, and `auth.view_customuser` **does not exist** in the live catalogue; the app is `authentication`.

---

## G. ~~Blocker~~ — resolved: the RBAC API does back the Users screen

**This section was wrong, and it parked Phase 5 for no reason.** It claimed the
RBAC users endpoints were "read + role-assignment only". Read against
`rbac/views.py` and `rbac/urls.py`, the full set exists and always did:

| Endpoint | Backing | Writable fields |
|---|---|---|
| `POST users/` | `StaffUserCreateSerializer` | `username`, `password`, `role`, `email`, `phone_number`, `first_name`, `last_name`, `is_active`, `employee_id` (poojari only) |
| `PATCH users/{id}/` | `StaffUserUpdateSerializer` | `role`, `email`, `phone_number`, `first_name`, `last_name`, `is_active` |
| `DELETE users/{id}/` | deactivates; the row is kept so past counter activity stays attributable |
| `POST users/{id}/activate/` | undo a deactivation |
| `POST users/{id}/set-password/` | separate so a profile edit cannot change a password by accident |
| `GET users/assignable-roles/` | the base-role dropdown's options |

Note the hyphens on `set-password` and `assignable-roles`, against the
underscores on `set_roles` / `assign_roles`.

Gating, from `rbac/permission_map.py` — `manage_users` is the line between
handing out roles and staffing the team:

| Action | Requires (ALL) |
|---|---|
| `list` / `retrieve` | `rbac.assign_roles` + `authentication.view_customuser` |
| `assign_roles` / `remove_roles` / `set_roles` | `rbac.assign_roles` |
| `create` | `rbac.manage_users` + `authentication.add_customuser` |
| `update` / `destroy` / `activate` / `set_password` | `rbac.manage_users` + `authentication.change_customuser` |
| `assignable_roles` | `rbac.manage_users` |

Two server-side guards surface as `400`s and need their own copy: an operator
cannot modify their own account, and only a superuser may modify a superuser.

### What genuinely has no source

| Field the design owns | Verdict |
|---|---|
| `first_name` / `last_name` | **Writable but not readable.** Both write serializers accept them; `UserRoleSerializer` returns neither. The form saves a name that never comes back. Needs the read serializer to expose them. |
| `avatar` | Nothing. `Avatar` renders initials from `username`. |
| `createdBy` / `modifiedBy` | Users carry `created_at` only. (Roles do carry `created_by_username` and `updated_at`.) |
| `activity`, `metrics` | No endpoint. Every number in the design's activity panels was prototype fiction. |
| `gods` (poojari deities) | A different domain — `gods` in the backend is a pooja↔category relation. |
| `is_active` / `ordering` as **query params** | Still unsupported on `GET users/`, so the status filter and column sorting stay out. |

**There is no destructive delete, and the UI must not offer one.** `DELETE`
deactivates. Drawing "Deactivate" and "Delete" side by side would be two
buttons for one outcome, one of them lying.

## H. Contract details with no client handling

- **`409` on role delete.** `mapHttpError` buckets it as `kind: 'validation'` with `status: 409` and `details.user_count` — usable, but the "still assigned to 3 users, re-send with `?force=true`" confirm-and-retry flow is a deliberate two-step that needs building, not a generic error toast.
- **`PATCH permissions` replaces, never merges.** The edit form must submit the full resulting set. Sending a delta silently wipes permissions.
- **`is_dangerous` needs a confirmation step** with the server's `warning` text (§4).
- **Built-in roles reject edit/delete/assign with `400`.** Drive off `is_system` / `is_editable` and disable the controls rather than letting a `400` explain it.
- **`403` vs `404`** — `mapHttpError` already separates these; the RBAC screens should say "you don't have permission" vs "that role is gone" rather than one generic message.
- **Self-service staleness.** §5/§7: role changes apply on the holder's next request, no re-login. `SESSION_STALE_TIME_MS` is 5 minutes, so an admin who edits their own roles keeps the old nav for up to 5 minutes. Every RBAC mutation must invalidate `authKeys.session()`.

---

# Plan

Phase 1 is a correctness fix worth doing on its own. Phases 2–4 are the actual feature and follow the `counter-pos/` layering. Phase 5 was never blocked — §G was a misreading of the API.

## Phase 1 — Close the route/sidebar gap ✅ done

1. ✅ `assignRoles`, `accessAllObjects` and `viewCustomuser` added to `PERMISSIONS`.
2. ✅ Every module route now carries the gate its NAV entry declares. `ProtectedRoute.requires` widened from a single codename to `readonly string[]`, matching the sidebar's all-must-hold rule.
3. ✅ Both read one source: `permissionsForPath()` in `nav.ts` flattens NAV into a path → codenames map (a child inherits its group's gate), and `routes.tsx` maps its screen table through it. `visibleNav()` moved to `nav.ts` too, so the rail and the router share the selector.
4. ✅ **`LandingRedirect`** — gating `/dashboard` meant the old `/` → `/dashboard` redirect would drop counter and store staff onto `/no-access` at sign-in. `/` now resolves to the user's first reachable module.
5. ✅ Dev-time warning when a route has no NAV entry — that route would mount ungated, and silently.

Verified: `tsc -b` clean, `oxlint` clean, production build succeeds, dev server serves the rewritten modules. **Not yet exercised against a live backend** — the permission combinations (counter-only staff, assign-only supervisor) still need a runtime pass once a session is available.

## Phase 2 — RBAC domain + infrastructure ✅ done

Mirrors `counter-pos/`. New feature slice `features/rbac/` — 28 files (`users-roles/` is left alone; it is the employee-registry screen, a different concern once §G resolves).

**Verified against the live backend at `127.0.0.1:8010`**, not just typechecked. Every response schema was parsed against a real payload, and the write paths were exercised end to end with a throwaway role (`create → patch → assign → 409 → force delete`), then cleaned up — the four seed roles and `counter.staff`'s assignment are unchanged.

Three things the live API disproved, now fixed in code:

| Assumed | Actual |
|---|---|
| `auth.view_customuser` | **`authentication.view_customuser`** — the `auth.` form does not exist. This was a live bug introduced in Phase 1. |
| Catalogue of ~33 permissions | **193**, in 9 groups, 3 flagged dangerous |
| Users list returns no phone | Returns **`phone_number`** |

Also captured because the live payloads carry them and the contract doc omits them: `codename` / `app_label` / `model` on each permission, `created_by_username` / `updated_at` on each role, `is_system` on each assigned role.

- `core/config/endpoints.ts` — extend `RBAC_ENDPOINTS` with `permissions`, `roles`, `role(id)`, `roleUsers(id)`, `assignRole(id)`, `unassignRole(id)`, `users`, `user(id)`, `assignUserRoles(id)`, `removeUserRoles(id)`, `setUserRoles(id)`.
- `domain/entities/` — `permission.ts` (`value`, `name`, `isDangerous`, `warning`), `permission-group.ts`, `rbac-role.ts` (numeric `id`, `name`, `label`, `isSystem`, `isEditable`, `isActive`, `permissions`, `permissionCount`, `userCount`), `rbac-user.ts` (`baseRole` + `assignedRoles[]` + optional `effectivePermissions`).
- `domain/repositories/rbac.repository.ts` — returns `Result<T>` throughout.
- `infrastructure/data-sources/remote/` — one zod schema + mapper per response, matching the `*.response.ts` convention. Paginated shapes reuse the counter module's `wire.ts` page helper.

## Phase 3 — Role management screens ✅ done

- ✅ `application/` — usecases, `rbacKeys`, query hooks and mutation hooks. `useRbacInvalidation` refreshes the RBAC lists *and* `authKeys.session()` after every write (§H), and every mutation uses it.
- ✅ **The role builder speaks modules, not codenames** — see `permission_map_fe.md`. The 13 product modules and their capabilities are transcribed into `rbac/domain/entities/module-map.ts`, and capabilities are expanded to codenames **client-side**, written through the live `PATCH roles/{id}/`. The server's `modules` API does not exist yet (`rbac/module_map.py` is absent; the backend plan is headed "not started"), so when it ships the swap is confined to the infrastructure layer. An "All permissions" view over the live 193-codename catalogue is the escape hatch for the 132 the map does not cover.
- ✅ **Round-trip fidelity is the property everything rests on.** `permissionsToSubmit(selectionFromPermissions(P), unmappedPermissions(P))` set-equals `P` for any `P`, so opening a role and saving it unchanged is a no-op on the server. `unmappedPermissions` is defined as "what the module view will not reproduce", **not** "codenames the map never mentions" — the latter misses codenames that appear in the map but complete no capability (a role with `e_commerce.change_stock` but no `rbac.access_admin_portal`), and would silently revoke them.
- ✅ **Subtractive revoke is unrepresentable**, not merely avoided: the save body is re-expanded from the surviving selection rather than diffed, so a shared codename is re-derived by whichever capability still names it. Verified exhaustively — zero collateral across every capability against thousands of selections. Around 11% of unticks are *ineffective* (another ticked capability still grants it), which the builder says out loud.
- **Roles list** — `GET roles/`, `custom_only` toggle, `user_count`/`permission_count` columns. Create/edit/delete gated on `manageRoles`; the list itself only needs `assignRoles` (§E).
- ✅ **Role builder** — module/capability grid by default, raw catalogue behind a tab. `is_dangerous` opens a confirm showing the server's `warning` **read from the live catalogue**, never a hardcoded list (the doc and `constants.py` say four dangerous permissions; the live server returned three). `name` is create-only with the `^[a-z][a-z0-9_]*$` hint and permanence note; edit exposes `label`/`description`/`permissions`/`is_active`. **Edit submits the full permission set**, never a delta.
- **Delete** — on `409`, read `details.user_count`, confirm, retry with `?force=true`. `is_system` roles show delete disabled with a reason, not an error.
- **Role members** — `roles/{id}/users/` list plus bulk `assign/` / `unassign/`, gated on `assignRoles`.

## Phase 4 — Replace mock role display

- Delete `roles.mock.ts`. `findRole`/`roleBadgeColor` currently fall back to `ROLES[0]` (`roles.ts:8`) — with server roles that fallback is wrong; return `null` and let callers render the raw label.
- `RoleKind` has no server equivalent: derive the badge colour from `role.id` (stable hash) or a small `name`→colour map with a neutral default.
- `UserRoleSection` becomes multi-select over active custom roles, showing base role separately as read-only, and its helper text changes from "access is predefined per role" to the union rule.
- `ModuleAccessPanel` renders resolved permissions (grouped, from `users/{id}/` `effective_permissions`) instead of invented module names — or is dropped in favour of a link to the role.

## Phase 5 — Users screen ✅ done

The list and detail were wired in Phase 4. Staff-account CRUD followed once §G
turned out to be stale: create, edit, deactivate, reactivate and set-password
are wired to the endpoints tabled above, with the base role editable through
`PATCH role`. `avatar`, `createdBy`/`modifiedBy`, `activity`, `metrics` and
`gods` remain undrawn — they have no source, and drawing them from mocks beside
real fields is the specific hazard this integration removed.

## Sequencing

Phase 1 stands alone and can ship immediately. Phases 2–4 are one deliverable — role management is useless in halves. Phase 5 is independent of them and needed no backend answer.
