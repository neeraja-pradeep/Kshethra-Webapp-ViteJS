/**
 * The signed-in operator, as the server sees them.
 *
 * `permissions` is the only field the UI may gate on. A counter operator's
 * `baseRole` is still `temple_user` — their back-office access comes from a
 * custom role, so branching on the role name hides features from the very
 * people who were granted them.
 */

/** A custom (non-system) role granted on top of the base role. */
export interface SessionRole {
  readonly id: number
  readonly name: string
  readonly label: string
}

export interface SessionUser {
  readonly id: number
  readonly username: string
  readonly baseRole: string
  readonly isSuperuser: boolean
  readonly roles: readonly SessionRole[]
  readonly permissions: readonly string[]
}

/** Display name for the account menu — the API exposes no separate full name here. */
export function sessionDisplayName(user: SessionUser): string {
  return user.username
}

/** The label shown under the name: the custom roles, else the base role. */
export function sessionRoleLabel(user: SessionUser): string {
  if (user.isSuperuser) return 'Superuser'
  if (user.roles.length > 0) return user.roles.map((role) => role.label).join(', ')
  return user.baseRole
}
