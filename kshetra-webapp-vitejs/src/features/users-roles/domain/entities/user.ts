/** Account status. Inactive users are locked out but keep their record + history. */
export type UserStatus = 'Active' | 'Inactive'

/**
 * Role-dependent activity counters. Which fields are populated depends on
 * the user's role kind (counter staff vs. store staff vs. poojari); admins
 * and managers carry no metrics.
 */
export interface UserMetrics {
  readonly bookingsTaken?: number
  readonly collectionHandled?: number
  readonly transactions?: number
  readonly ordersFulfilled?: number
  readonly refundsRecorded?: number
  readonly stockAdjustments?: number
  readonly completedToday?: number
  readonly upcomingToday?: number
  readonly completedMonth?: number
  readonly upcomingMonth?: number
}

/** An employee / login registry entry. Email + phone form the login allowlist. */
export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly roleId: string
  readonly status: UserStatus
  readonly avatar: string | null
  readonly createdBy: string
  /** ISO date, e.g. "2024-06-27". */
  readonly createdAt: string
  readonly modifiedBy: string
  /** ISO date. */
  readonly modifiedAt: string
  /** Lifetime activity count — a positive value blocks permanent deletion. */
  readonly activity: number
  readonly metrics: UserMetrics
  /** God ids this poojari is assigned to (only meaningful for poojari roles). */
  readonly gods: readonly string[]
}
