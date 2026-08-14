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
  /**
   * `temple_user` | `temple_poojari` | `temple_admin`, and the staff roles.
   *
   * Editable through `PATCH users/{id}/`, which re-syncs the account's groups
   * in one step. Saving it grants the new role's permissions and revokes the
   * previous role's — it is not additive, unlike `assignedRoles`.
   */
  readonly baseRole: string
  /** Custom roles only — the base role is `baseRole`. */
  readonly assignedRoles: readonly AssignedRole[]
  readonly isActive: boolean
  readonly isSuperuser: boolean
  readonly createdAt: string
}

/** `rbac/users/{id}/` — the row plus the flattened resolved permission set. */
export interface RbacUserDetail extends RbacUser {
  /** Base role's permissions unioned with every assigned role's. */
  readonly effectivePermissions: readonly string[]
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
