/**
 * A user as the RBAC registry sees them.
 *
 * The shape that matters: a **fixed `baseRole`** decides which sign-in endpoint
 * accepts them, and **any number of additive `assignedRoles`** sit on top.
 * Permissions are the union — assigning a role never removes anything, and
 * there is no single "the user's role" to display.
 */

/** A custom role granted on top of the base role. Built-ins never appear here. */
export interface AssignedRole {
  readonly id: number
  readonly name: string
  readonly label: string
  readonly isActive: boolean
  /** Always `false` in practice — built-ins can't be assigned as extras. */
  readonly isSystem: boolean
}

/** Registry row, from `rbac/users/`. */
export interface RbacUser {
  readonly id: number
  readonly username: string
  /** May be an empty string — not every account has one. */
  readonly email: string
  /**
   * Returned by the registry, despite the contract doc listing phone as
   * searchable only. Verified against the live endpoint.
   */
  readonly phone: string
  /** Blank on accounts created without one. */
  readonly firstName: string
  readonly lastName: string
  /**
   * The server's rendering of the two names, which **falls back to `username`**
   * when both are blank — so it is always safe to show, but it is not proof
   * that a real name was ever entered. Check `firstName`/`lastName` for that.
   */
  readonly fullName: string
  /**
   * `temple_user` | `temple_poojari` | `temple_admin`, and the staff roles.
   *
   * Editable through `PATCH users/{id}/`, which re-syncs the account's groups
   * in one step. Saving it grants the new role's permissions and revokes the
   * previous role's — it is not additive, unlike `assignedRoles`.
   */
  readonly baseRole: string
  /**
   * The server's own display text for `baseRole` — "Admin", "Devotee",
   * "Superuser" for the empty base role.
   *
   * Served alongside every row so the client never has to keep its own map of
   * role names to labels, which is how the list and the role dropdown came to
   * disagree about `temple_admin`. Empty only if the backend predates the
   * field; `baseRoleLabel` falls back to deriving one then.
   */
  readonly baseRoleLabel: string
  /** Custom roles only — the base role is `baseRole`. */
  readonly assignedRoles: readonly AssignedRole[]
  readonly isActive: boolean
  readonly isSuperuser: boolean
  readonly createdAt: string
}

/**
 * One product module as the **server** resolves it for a user.
 *
 * Distinct from `ProductModule` in `module-map.ts`: that map is the client's
 * stand-in for a `GET /rbac/modules/` the backend has not shipped, and it
 * describes what a module *could* grant. This is the server's own answer for
 * one account, carrying its own label — so it stays right as the backend adds
 * modules the client map has never heard of.
 */
export interface UserModuleAccess {
  /** Stable key, e.g. `counter_bookings`. */
  readonly key: string
  /** The server's display text, e.g. "Counter Bookings". */
  readonly label: string
  /**
   * Every capability the module defines, each held or not. Denied ones are
   * kept: "cannot void a sale" is what an operator is checking for, and
   * dropping the false ones would leave them unable to tell a withheld
   * capability from one this module never had.
   */
  readonly capabilities: readonly UserModuleCapability[]
}

export interface UserModuleCapability {
  readonly key: string
  readonly granted: boolean
}

/** `rbac/users/{id}/` — the row plus the flattened resolved permission set. */
export interface RbacUserDetail extends RbacUser {
  /** Base role's permissions unioned with every assigned role's. */
  readonly effectivePermissions: readonly string[]
  /**
   * The same answer grouped the way the product speaks, straight from the
   * server. Empty only if the backend predates the field — the panel falls
   * back to the raw codenames then.
   */
  readonly modules: readonly UserModuleAccess[]
}

/**
 * What `set_roles` changed. The other two writes are deliberately silent about
 * it — only a wholesale replace needs to report what it took away.
 */
export interface SetRolesOutcome {
  readonly user: RbacUserDetail
  /** Role `name`s added by this call — identifiers, not display labels. */
  readonly added: readonly string[]
  /** Role `name`s removed by this call. */
  readonly removed: readonly string[]
}

/** The label under a user's name: their custom roles, else the base role. */
export function rolesLabel(user: RbacUser): string {
  if (user.isSuperuser) return 'Superuser'
  if (user.assignedRoles.length > 0) return user.assignedRoles.map((role) => role.label).join(', ')
  return user.baseRole
}

/** One option in the base-role dropdown, from `users/assignable-roles/`. */
export interface AssignableBaseRole {
  readonly name: string
  readonly label: string
  readonly description: string
}

/**
 * Body for `POST users/`.
 *
 * `username` is the sign-in identifier and cannot be changed afterwards, so it
 * only appears here. `password` has its own endpoint for the same reason in
 * reverse: a routine profile edit must not be able to change it by accident.
 */
export interface CreateStaffUserInput {
  readonly username: string
  readonly password: string
  /** One of the staff roles — this screen staffs the temple, it does not mint devotees. */
  readonly role: string
  readonly email?: string
  readonly phoneNumber?: string
  readonly firstName?: string
  readonly lastName?: string
  readonly isActive?: boolean
  /** Poojari accounts only; generated when left blank. Rejected for any other role. */
  readonly employeeId?: string
}

/** Body for `PATCH users/{id}/`. No `username` — it is permanent. */
export interface UpdateStaffUserInput {
  readonly role?: string
  readonly email?: string
  readonly phoneNumber?: string
  readonly firstName?: string
  readonly lastName?: string
  readonly isActive?: boolean
}
