/**
 * A role as the RBAC API models it.
 *
 * Not to be confused with `users-roles/domain/entities/role.ts`, which is the
 * design prototype's fixed seven-role seed. That one is display data with a
 * string id and a list of module names; this one is the server's record, is
 * created and edited at runtime, and carries permission codenames.
 */

/**
 * The permission that admits a holder to `auth/admin-signin/`. A back-office
 * role that omits it gets `403` at login with everything else correct — the
 * contract calls this the most common setup mistake, so the builder warns.
 *
 * Mirrors `PERMISSIONS.accessAdminPortal`; the rbac domain may not reach into
 * another feature's application layer for it.
 */
export const ADMIN_PORTAL_PERMISSION = 'rbac.access_admin_portal'

export interface RbacRole {
  readonly id: number
  /** Lowercase identifier. **Permanent** — fixed at creation, ignored on PATCH. */
  readonly name: string
  /** The display name, and the only renameable field. Use it everywhere. */
  readonly label: string
  readonly description: string
  /** One of the three built-ins: not editable, deletable, or assignable as an extra. */
  readonly isSystem: boolean
  readonly isEditable: boolean
  /** Inactive roles still exist but cannot be assigned. */
  readonly isActive: boolean
  /** Permission `value` strings. */
  readonly permissions: readonly string[]
  readonly permissionCount: number
  /** How many users hold it. */
  readonly userCount: number
  readonly createdAt: string
  readonly updatedAt: string
  /** Who created it. `null` for the built-ins, which no one created. */
  readonly createdByUsername: string | null
}

/** `name` is required here and nowhere else — it can never be changed afterwards. */
export interface CreateRoleInput {
  readonly name: string
  readonly label: string
  readonly description?: string
  readonly permissions?: readonly string[]
  readonly isActive?: boolean
}

/**
 * Only what changes. Omit `permissions` to leave the set alone — but a
 * `permissions` array **replaces the whole set rather than merging**, so a
 * caller adding one permission must send every existing one alongside it.
 */
export interface UpdateRoleInput {
  readonly label?: string
  readonly description?: string
  readonly permissions?: readonly string[]
  readonly isActive?: boolean
}

/**
 * Deleting a role that still has holders is a deliberate two-step, not a
 * failure: the server answers `409` with the count so the UI can confirm and
 * retry with `force`. Modelled as an outcome rather than an error because the
 * caller is expected to handle it, not report it.
 */
export type DeleteRoleOutcome =
  | { readonly kind: 'deleted'; readonly detail: string }
  | { readonly kind: 'stillAssigned'; readonly detail: string; readonly userCount: number }

/** `^[a-z][a-z0-9_]*$` — lowercase letters, digits and underscores, starting with a letter. */
const NAME_PATTERN = /^[a-z][a-z0-9_]*$/

export function isValidRoleName(name: string): boolean {
  return NAME_PATTERN.test(name)
}

/** Whether this role may be granted as an extra role. Built-ins never can. */
export function isAssignable(role: RbacRole): boolean {
  return !role.isSystem && role.isActive
}

/** Whether holders of this role can reach the back office at all. */
export function grantsAdminPortal(permissions: readonly string[]): boolean {
  return permissions.includes(ADMIN_PORTAL_PERMISSION)
}

/**
 * True for the trap in §8: a role built for the back office — it grants console
 * permissions — that would still be refused at sign-in.
 */
export function missingAdminPortal(permissions: readonly string[]): boolean {
  return permissions.length > 0 && !grantsAdminPortal(permissions)
}
