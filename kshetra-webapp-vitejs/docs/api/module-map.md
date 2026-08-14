# Module map — why the console expands capabilities itself

The role builder speaks the vocabulary of [permission_map_fe.md](permission_map_fe.md):
13 product modules, each with capabilities like *"Void a sale"*, instead of the
193 raw Django codenames the server actually gates on.

**The server-side half of that contract does not exist.** `GET /rbac/modules/`,
`PUT|PATCH /rbac/roles/{id}/modules/` and `rbac/module_map.py` are all absent —
`grep -rn "modules\|MODULE" rbac/*.py` returns nothing, and the backend plan is
headed *"Status: not started."* So the console does the expansion:

```
capabilities ticked
      ↓  expandCapabilities()          module-map.ts, pure
codename union  ∪  permissions held outside the map
      ↓
PATCH /rbac/roles/{id}/  { permissions: [...] }     ← live today
```

`resolveModules()` runs the same map backwards to draw the checkboxes.

## When the backend ships

Only the infrastructure layer changes: add a `modules.response.ts`, a
`fetchModules` repository method, and swap `permissionsToSubmit` for a call to
`PUT /roles/{id}/modules/`. Nothing in the presentation layer types a module or
capability key as a literal, so the map can become server data without a
cascading refactor.

## The three things that will bite

**1. `PATCH permissions` replaces, it does not merge.** The map covers 61 of
193 codenames. Submitting only what the modules expand to would revoke the
other 132. Every save therefore sends `expand(selection) ∪ unmapped`.

**2. "Unmapped" is not "not in the map".** `unmappedPermissions` is defined as
*what the module view will not reproduce* — `P − expand(resolve(P))`. The
intuitive test, membership in the map's codename set, is wrong: a role holding
`e_commerce.change_stock` without `rbac.access_admin_portal` completes neither
`stock.update` nor `store_orders.create`, so nothing re-derives it, yet the map
does mention it. That definition is what makes open-and-save provably a no-op.

**3. Never diff.** The save body is recomputed from the surviving selection
every time. That is why unticking `counter_bookings.create` keeps
`rbac.operate_counter` — `read` still names it — and it is why the collateral
strip the contract calls *"the single most likely bug in this feature"* cannot
be written here. Verified exhaustively: zero collateral across every capability
against thousands of selections. An "optimisation" that maintains a running
permission array would hand the bug straight back.

## Consequences worth knowing

- **Capabilities share codenames across modules**, so ticking two unrelated
  modules can grant a third's capability. `booking.add_poojaorder` backs both
  `counter_bookings.create` and `pooja_orders.create`; `rbac.assign_roles`
  backs `users.read`, `roles.read` and `roles.assign`. The grid renders the
  *resolution*, not the ticks, because that is what the server will enforce.
- **About one untick in nine changes nothing** — another ticked capability
  still requires the same codenames. The builder says so instead of letting the
  checkbox spring back.
- **`rbac.access_admin_portal` is not a capability.** It appears only as a
  co-requisite inside `store_products.*` and `stock.*`, so the "role cannot
  sign in" fix adds it as an extra rather than ticking something.

## Known defects in the source contract

- §2 says *"Twelve modules"* and enumerates thirteen (`songs` is the extra).
  Thirteen is right; §5's quick reference agrees.
- §3.4's `dangerous_permissions` lists four; `rbac/constants.py` agrees; the
  live catalogue returned three. The console reads `is_dangerous` and `warning`
  from `GET /rbac/permissions/` and keeps no copy, so it cannot be wrong either way.
- §3.4 returns `modules` as an ordered array while §3.2 and §4.2 return it as a
  JSON object, then §5 guarantees *"Declaration order is meaningful"* — which an
  object cannot carry. Our order comes from the local array; whoever builds the
  backend should settle this.
- `users.update` and `users.delete` require an identical codename set, as do
  `roles.create`/`update`/`delete`. They cannot be granted independently — the
  server's own module endpoint would report the same collapse.
