/** Account status. Inactive users are locked out but keep their record + history. */
/**
 * What remains of the prototype user model.
 *
 * The registry's own shape is `RbacUser` in `features/rbac/`. These two types
 * survive because presentational components still speak them: `StatusBadge`
 * renders a status word, and the activity panels are drawn against metrics no
 * endpoint returns yet. The prototype `User` and `Role` entities are gone —
 * they contradicted the backend (string ids, a single `roleId`, module names
 * as display strings) and having both models on disk invited using the wrong one.
 */
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
