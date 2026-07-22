/** Cross-feature shared domain vocabulary. */

export type UserRole = 'Admin' | 'Manager' | 'Counter staff' | 'Store staff' | 'Poojari'

/** The signed-in operator (static in the prototype). */
export interface SessionUser {
  readonly name: string
  readonly role: UserRole
  readonly scope: string
}
