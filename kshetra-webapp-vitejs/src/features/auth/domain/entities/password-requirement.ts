/** A single "password must have…" rule shown while setting a new password. */
export interface PasswordRequirement {
  readonly id: string
  readonly label: string
  readonly met: boolean
}
