/** Broad grouping used to pick a role's badge colour and its detail-screen activity panel. */
export type RoleKind = 'admin' | 'manager' | 'counter' | 'store' | 'poojari'

/**
 * A fixed, predefined role. Roles are not user-editable — module access is
 * baked into the role and shown read-only on the user's detail screen.
 */
export interface Role {
  readonly id: string
  readonly label: string
  readonly kind: RoleKind
  /** Whether this role can sign in to the admin web console. */
  readonly web: boolean
  readonly modules: readonly string[]
  readonly desc: string
}
