/**
 * Product modules and their capabilities — the vocabulary the role builder speaks.
 *
 * An operator composes a role out of "Void a sale", not out of
 * `booking.add_counterreceipt`. This map is what makes that possible: each
 * capability names the AND-set of Django codenames the server actually checks,
 * transcribed from `docs/api/permission_map_fe.md` §2, which in turn mirrors
 * `rbac/permission_map.py`.
 *
 * **This lives on the client only until the backend ships it.** The contract
 * defines `GET /rbac/modules/` and `PUT /rbac/roles/{id}/modules/`; neither
 * exists yet, so the console expands capabilities to codenames here and writes
 * through `PATCH /rbac/roles/{id}/`. Keep `resolveModules` and
 * `expandCapabilities` the only way anything reads this map — when the server
 * endpoints land, the swap is confined to the infrastructure layer.
 *
 * Two things deliberately NOT here:
 *
 * - **Which permissions are dangerous.** The catalogue endpoint returns
 *   `is_dangerous` and a `warning` per permission, and the confirmation step
 *   must show the server's wording. A second copy here could only drift.
 * - **Who resolves true.** The contract's role columns are illustrative; the
 *   answer is whatever codenames the signed-in user actually holds.
 */

/** One action inside a module. Holding every codename in `permissions` grants it. */
export interface ModuleCapability {
  /** Stable key — API surface once the backend ships. */
  readonly key: string
  /** Display text. Product vocabulary, not database vocabulary. */
  readonly label: string
  /** ALL of these are required — the server checks them as an AND. */
  readonly permissions: readonly string[]
}

/** A product module: one screen or one coherent job. */
export interface ProductModule {
  readonly key: string
  readonly label: string
  readonly description: string
  readonly capabilities: readonly ModuleCapability[]
}

/** A module's capabilities, each either held or not. */
export type ModuleCapabilities = Readonly<Record<string, boolean>>

/** Every module's resolved capabilities, keyed by module. */
export type ResolvedModules = Readonly<Record<string, ModuleCapabilities>>

/** The capability keys selected per module — what the builder's checkboxes hold. */
export type ModuleSelection = Readonly<Record<string, readonly string[]>>

/**
 * The map, in render order.
 *
 * Order is meaningful: it is the order the role builder lists modules in, and
 * the contract asks consumers to preserve it.
 */
export const MODULE_MAP: readonly ProductModule[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'The operational snapshot: takings and fulfilment at a glance.',
    capabilities: [
      { key: 'read', label: 'View the dashboard', permissions: ['rbac.view_admin_dashboard'] },
    ],
  },
  {
    key: 'pooja_orders',
    label: 'Pooja Orders',
    description: 'The transaction view — orders, payments and refunds.',
    capabilities: [
      { key: 'read', label: 'View orders', permissions: ['rbac.manage_pooja_orders', 'booking.view_poojaorder'] },
      { key: 'create', label: 'Raise an order', permissions: ['rbac.manage_pooja_orders', 'booking.add_poojaorder'] },
      { key: 'update', label: 'Edit an order', permissions: ['rbac.manage_pooja_orders', 'booking.change_poojaorder'] },
      { key: 'delete', label: 'Delete an order', permissions: ['rbac.manage_pooja_orders', 'booking.delete_poojaorder'] },
      // Both cancel endpoints move money, so they sit behind their own
      // permission rather than the plain back-office scope.
      { key: 'refund', label: 'Cancel or refund', permissions: ['rbac.refund_pooja_order'] },
      { key: 'export', label: 'Export orders', permissions: ['rbac.export_pooja_orders'] },
    ],
  },
  {
    key: 'counter_bookings',
    label: 'Counter Bookings',
    description: 'The counter desk: walk-in bookings and agent-code collections.',
    capabilities: [
      { key: 'read', label: 'Open the counter', permissions: ['rbac.operate_counter'] },
      { key: 'create', label: 'Take a booking', permissions: ['rbac.operate_counter', 'booking.add_poojaorder'] },
      // A step above taking the sale on purpose: counter staff may create but
      // not void. There is no update or delete — a counter sale is never edited.
      { key: 'cancel', label: 'Void a sale', permissions: ['rbac.cancel_counter_sale'] },
      { key: 'collect_payment', label: 'Collect payment', permissions: ['rbac.collect_counter_payment'] },
    ],
  },
  {
    key: 'bookings_execution',
    label: 'Booking Execution',
    description: 'The execution view — poojas to perform, by date.',
    capabilities: [
      { key: 'read', label: 'View the schedule', permissions: ['rbac.manage_pooja_orders', 'booking.view_poojaorderline'] },
      { key: 'complete', label: 'Mark performed', permissions: ['rbac.manage_pooja_orders', 'booking.change_poojaorderline'] },
      // Rostering is a different job from handling an order, so a duty manager
      // can be given this without the rest of the back office.
      { key: 'assign', label: 'Assign a poojari', permissions: ['rbac.assign_poojari', 'booking.change_poojaorderline'] },
    ],
  },
  {
    key: 'pooja_catalogue',
    label: 'Poojas & Categories',
    description: 'Master data for poojas and their categories.',
    capabilities: [
      // Every role holds this, devotees included — you cannot book what you
      // cannot see. Nav visibility is a separate decision from `read`.
      { key: 'read', label: 'View the catalogue', permissions: ['booking.view_pooja'] },
      { key: 'create', label: 'Add a pooja', permissions: ['booking.add_pooja'] },
      { key: 'update', label: 'Edit a pooja', permissions: ['booking.change_pooja'] },
      { key: 'delete', label: 'Delete a pooja', permissions: ['booking.delete_pooja'] },
    ],
  },
  {
    key: 'store_orders',
    label: 'Store Orders',
    description: 'Shop orders — fulfilment, walk-in sales and refunds.',
    capabilities: [
      // `access_all_objects` carries real weight here: these endpoints act on
      // an order named in the URL and do no ownership check of their own. A
      // devotee holds view_order for their own records, so dropping it would
      // resolve true and show them a back-office screen.
      { key: 'read', label: 'View orders', permissions: ['rbac.access_all_objects', 'e_commerce.view_order', 'e_commerce.view_orderline'] },
      { key: 'create', label: 'Take a walk-in sale', permissions: ['rbac.access_all_objects', 'e_commerce.add_order', 'e_commerce.add_orderline', 'e_commerce.change_stock'] },
      { key: 'update', label: 'Update fulfilment', permissions: ['rbac.access_all_objects', 'e_commerce.change_order'] },
      { key: 'refund', label: 'Cancel or refund', permissions: ['rbac.access_all_objects', 'rbac.refund_ecommerce_order', 'e_commerce.change_order'] },
      { key: 'export', label: 'Export orders', permissions: ['rbac.export_ecommerce_orders'] },
    ],
  },
  {
    key: 'store_products',
    label: 'Store Catalogue',
    description: 'Products, variants and pricing.',
    capabilities: [
      { key: 'read', label: 'View products', permissions: ['rbac.access_admin_portal', 'e_commerce.view_product', 'e_commerce.view_productvariant'] },
      // The variant permissions are not optional: one call writes the product
      // and the variant carrying its price and SKU. A role that may add a
      // product but not price it must not get the form.
      { key: 'create', label: 'Add a product', permissions: ['rbac.access_admin_portal', 'e_commerce.add_product', 'e_commerce.add_productvariant'] },
      { key: 'update', label: 'Edit a product', permissions: ['rbac.access_admin_portal', 'e_commerce.change_product', 'e_commerce.change_productvariant'] },
      { key: 'delete', label: 'Delete a product', permissions: ['rbac.access_admin_portal', 'e_commerce.delete_product'] },
    ],
  },
  {
    key: 'stock',
    label: 'Stock',
    description: 'Shelf quantities and stock adjustments.',
    capabilities: [
      // Split from the catalogue precisely because App Manager owns the
      // products but is deliberately given no stock permission.
      { key: 'read', label: 'View stock', permissions: ['rbac.access_admin_portal', 'e_commerce.view_stock'] },
      { key: 'update', label: 'Adjust stock', permissions: ['rbac.access_admin_portal', 'e_commerce.change_stock'] },
    ],
  },
  {
    key: 'poojaris',
    label: 'Poojaris',
    description: 'The poojari register — profiles, onboarding and activation.',
    capabilities: [
      // `manage_poojaris` is what keeps poojaris out of this module: they hold
      // view/change on their OWN profile, so the model permission alone cannot
      // gate the screen.
      { key: 'read', label: 'View poojaris', permissions: ['rbac.manage_poojaris', 'temple_poojari.view_poojariprofile'] },
      { key: 'create', label: 'Add a poojari', permissions: ['rbac.manage_poojaris', 'temple_poojari.add_poojariprofile'] },
      { key: 'update', label: 'Edit a poojari', permissions: ['rbac.manage_poojaris', 'temple_poojari.change_poojariprofile'] },
      { key: 'delete', label: 'Delete a poojari', permissions: ['rbac.manage_poojaris', 'temple_poojari.delete_poojariprofile'] },
      { key: 'register', label: 'Register a poojari account', permissions: ['rbac.register_poojari'] },
      { key: 'activate', label: 'Activate a poojari', permissions: ['rbac.activate_poojari'] },
      { key: 'export', label: 'Export poojaris', permissions: ['rbac.export_poojari'] },
    ],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Broadcast campaigns to app users. Not the devotee inbox.',
    capabilities: [
      { key: 'read', label: 'View campaigns', permissions: ['rbac.manage_notifications', 'notifications.view_notifications'] },
      { key: 'create', label: 'Draft a campaign', permissions: ['rbac.manage_notifications', 'notifications.add_notifications'] },
      { key: 'update', label: 'Edit a campaign', permissions: ['rbac.manage_notifications', 'notifications.change_notifications'] },
      { key: 'delete', label: 'Delete a campaign', permissions: ['rbac.manage_notifications', 'notifications.delete_notifications'] },
      { key: 'send', label: 'Send a campaign', permissions: ['rbac.send_notification'] },
      { key: 'statistics', label: 'View delivery statistics', permissions: ['rbac.view_notification_statistics'] },
    ],
  },
  {
    key: 'users',
    label: 'Staff Accounts',
    description: 'The login registry: who works here and what they may reach.',
    capabilities: [
      { key: 'read', label: 'View staff accounts', permissions: ['rbac.assign_roles', 'authentication.view_customuser'] },
      { key: 'create', label: 'Create an account', permissions: ['rbac.manage_users', 'authentication.add_customuser'] },
      { key: 'update', label: 'Edit an account', permissions: ['rbac.manage_users', 'authentication.change_customuser'] },
      // Named `delete` after the button. DELETE deactivates and keeps the row
      // so a clerk who took counter payments stays attributable — hence
      // `change_customuser`, not `delete_customuser`.
      { key: 'delete', label: 'Deactivate an account', permissions: ['rbac.manage_users', 'authentication.change_customuser'] },
    ],
  },
  {
    key: 'roles',
    label: 'Roles',
    description: 'Authoring roles and handing them out.',
    capabilities: [
      { key: 'read', label: 'View roles', permissions: ['rbac.assign_roles'] },
      // Authoring is separated from assigning on purpose: putting someone on
      // the front desk is a weaker act than inventing new powers. Keep the two
      // distinct in the UI or the distinction is lost.
      { key: 'create', label: 'Create a role', permissions: ['rbac.manage_roles'] },
      { key: 'update', label: 'Edit a role', permissions: ['rbac.manage_roles'] },
      { key: 'delete', label: 'Delete a role', permissions: ['rbac.manage_roles'] },
      { key: 'assign', label: 'Assign a role', permissions: ['rbac.assign_roles'] },
    ],
  },
  {
    key: 'songs',
    label: 'Songs',
    description: 'Audio tracks and cover art for the devotee app.',
    capabilities: [
      { key: 'read', label: 'View songs', permissions: ['song.view_song'] },
      { key: 'create', label: 'Add a song', permissions: ['song.add_song'] },
      { key: 'update', label: 'Edit a song', permissions: ['song.change_song'] },
      { key: 'delete', label: 'Delete a song', permissions: ['song.delete_song'] },
    ],
  },
]

/** Every codename any capability names, deduped. The map's whole footprint. */
export const MAPPED_PERMISSIONS: ReadonlySet<string> = new Set(
  MODULE_MAP.flatMap((module) => module.capabilities.flatMap((capability) => capability.permissions)),
)

/** Looks a module up by key. */
export function findModule(key: string): ProductModule | null {
  return MODULE_MAP.find((module) => module.key === key) ?? null
}

/**
 * Codenames → per-module capability booleans, strict AND.
 *
 * Every module and every capability is always present, `false` rather than
 * omitted, so callers never need a `hasOwnProperty` check — the same guarantee
 * the server's version of this will make.
 */
export function resolveModules(codenames: readonly string[]): ResolvedModules {
  const held = new Set(codenames)
  const resolved: Record<string, ModuleCapabilities> = {}

  for (const module of MODULE_MAP) {
    const capabilities: Record<string, boolean> = {}
    for (const capability of module.capabilities) {
      capabilities[capability.key] = capability.permissions.every((permission) => held.has(permission))
    }
    resolved[module.key] = capabilities
  }

  return resolved
}

/** The capability keys a codename set resolves to, in the shape the builder edits. */
export function selectionFromPermissions(codenames: readonly string[]): ModuleSelection {
  const resolved = resolveModules(codenames)
  const selection: Record<string, readonly string[]> = {}

  for (const module of MODULE_MAP) {
    selection[module.key] = module.capabilities
      .filter((capability) => resolved[module.key]?.[capability.key])
      .map((capability) => capability.key)
  }

  return selection
}

/**
 * Selected capabilities → the deduped union of codenames they require.
 *
 * **Always expand over the whole surviving selection; never compute a delta.**
 * Capabilities share codenames — `counter_bookings.read` and `.create` both
 * need `rbac.operate_counter` — so subtracting a capability's permissions on
 * untick would strip `read` as collateral. Re-expanding the still-ticked set
 * cannot make that mistake, because a shared codename is re-derived from
 * whichever capability still names it. Optimising this into a diff would
 * reintroduce the bug the contract calls the most likely one in this feature.
 */
export function expandCapabilities(selection: ModuleSelection): readonly string[] {
  const codenames = new Set<string>()

  for (const module of MODULE_MAP) {
    const selected = selection[module.key] ?? []
    for (const capability of module.capabilities) {
      if (!selected.includes(capability.key)) continue
      for (const permission of capability.permissions) codenames.add(permission)
    }
  }

  return [...codenames].sort()
}

/**
 * The capabilities that resolve true without having been ticked.
 *
 * Codenames are shared ACROSS modules, not just within one: `booking.add_poojaorder`
 * backs both `counter_bookings.create` and `pooja_orders.create`, and
 * `rbac.assign_roles` backs `users.read`, `roles.read` and `roles.assign`. So
 * granting a role the counter desk plus pooja-order reads also, genuinely,
 * lets it raise a pooja order — the server would allow the call.
 *
 * This is not drift to be corrected. The contract's rule is that a capability
 * is true when the user holds every permission it needs, however they came by
 * them, and the server gates exactly that way. Show these as held; a builder
 * that hid them would promise a restriction that does not exist.
 */
export function impliedCapabilities(selection: ModuleSelection): readonly string[] {
  const resolved = resolveModules(expandCapabilities(selection))
  const implied: string[] = []

  for (const module of MODULE_MAP) {
    const selected = selection[module.key] ?? []
    for (const capability of module.capabilities) {
      if (resolved[module.key]?.[capability.key] && !selected.includes(capability.key)) {
        implied.push(`${module.key}.${capability.key}`)
      }
    }
  }

  return implied
}

/** What unticking one capability actually did. */
export interface CapabilityToggle {
  readonly selection: ModuleSelection
  /**
   * True when unticking changed nothing: another still-ticked capability names
   * every codename this one did, so the role holds it either way. Around one
   * untick in nine lands here, so the builder must say so — a checkbox that
   * springs back with no explanation reads as broken.
   */
  readonly ineffective: boolean
}

/**
 * Toggles one capability.
 *
 * **Unticking can never cost a capability the operator still has ticked.**
 * That is a property of re-expanding the whole surviving selection rather than
 * subtracting the unticked capability's codenames: any capability still ticked
 * re-supplies every codename it needs, by definition. Subtractive revoke — the
 * failure the contract calls the most likely bug in this feature, where
 * dropping `create` silently strips `read` — is not mitigated here so much as
 * made unrepresentable. Verified exhaustively over every capability against
 * thousands of selections: zero collateral, in either direction.
 *
 * What CAN surprise is the other direction, hence `ineffective`.
 */
export function toggleCapability(
  selection: ModuleSelection,
  moduleKey: string,
  capabilityKey: string,
): CapabilityToggle {
  const current = selection[moduleKey] ?? []
  const ticking = !current.includes(capabilityKey)
  const next: Record<string, readonly string[]> = { ...selection }
  next[moduleKey] = ticking
    ? [...current, capabilityKey]
    : current.filter((key) => key !== capabilityKey)

  if (ticking) return { selection: next, ineffective: false }

  const resolved = resolveModules(expandCapabilities(next))
  return { selection: next, ineffective: resolved[moduleKey]?.[capabilityKey] === true }
}

/**
 * Replaces one module's ticks wholesale — what "select all" and "clear" do.
 *
 * Clearing a module does not necessarily clear its capabilities: another
 * module may supply the same codenames, in which case they keep resolving true
 * and the grid keeps showing them held. That is the honest answer, and the
 * same reason `toggleCapability` reports `ineffective`.
 */
export function setModuleCapabilities(
  selection: ModuleSelection,
  moduleKey: string,
  capabilityKeys: readonly string[],
): ModuleSelection {
  return { ...selection, [moduleKey]: [...capabilityKeys] }
}

/** Every capability key a module defines, for "select all". */
export function allCapabilityKeys(moduleKey: string): readonly string[] {
  return findModule(moduleKey)?.capabilities.map((capability) => capability.key) ?? []
}

/** Every codename a module's capabilities require, deduped — for a bulk grant. */
export function moduleCodenames(moduleKey: string): readonly string[] {
  const module = findModule(moduleKey)
  if (!module) return []
  return [...new Set(module.capabilities.flatMap((capability) => capability.permissions))].sort()
}

/**
 * A role's codenames that the module view will not reproduce.
 *
 * The map covers 61 of the server's 193 codenames, and `PATCH permissions`
 * replaces rather than merges. Submitting only the expanded set would silently
 * revoke everything here — so these must be carried through every save and
 * shown to the operator, never quietly dropped.
 *
 * **Defined as `codenames − expand(resolve(codenames))`, NOT as "codenames the
 * map never mentions".** The membership test feels right and is wrong: it
 * misses codenames that appear in the map but complete no capability. A role
 * holding `e_commerce.change_stock` without `rbac.access_admin_portal`
 * satisfies neither `stock.update` nor `store_orders.create`, so nothing
 * re-derives it — yet `MAPPED_PERMISSIONS` contains it, and a membership test
 * would drop it on the next save. This definition covers both cases by
 * construction, and it is what makes the round trip below hold.
 */
export function unmappedPermissions(codenames: readonly string[]): readonly string[] {
  const reproduced = new Set(expandCapabilities(selectionFromPermissions(codenames)))
  return [...new Set(codenames)].filter((codename) => !reproduced.has(codename)).sort()
}

/**
 * The full permission set to submit: what the modules grant, plus whatever was
 * granted outside the editor.
 *
 * **The only function that may produce a permission array for a write.** The
 * body is recomputed from scratch every save rather than edited in place —
 * that is what keeps the untick path safe (see `toggleCapability`), and an
 * "optimisation" that maintains a running array would give both hazards back
 * at once.
 *
 * Guarantees `permissionsToSubmit(selectionFromPermissions(P), unmappedPermissions(P))`
 * set-equals `P`: opening a role and saving it unchanged is a no-op on the
 * server, whatever the role holds. `assertRoundTrip` checks it at runtime.
 */
export function permissionsToSubmit(
  selection: ModuleSelection,
  unmapped: readonly string[],
): readonly string[] {
  return [...new Set([...expandCapabilities(selection), ...unmapped])].sort()
}

/**
 * Guards the save path against a silent revocation.
 *
 * Returns the codenames a submission would drop that the role still holds and
 * the operator never chose to remove. Anything here means the map and the
 * round trip disagree — a bug, not a decision — so the builder should refuse
 * the write rather than let the server act on it. Cheap enough to run on every
 * save, and it turns the feature's worst failure into a blocked button.
 */
export function silentlyRevoked(
  held: readonly string[],
  submitting: readonly string[],
  intentionallyRemoved: readonly string[] = [],
): readonly string[] {
  const next = new Set(submitting)
  const removed = new Set(intentionallyRemoved)
  return held.filter((codename) => !next.has(codename) && !removed.has(codename)).sort()
}
