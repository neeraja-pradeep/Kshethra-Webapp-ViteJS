/**
 * Devotee — an app user account. Accounts are created by devotees in the
 * consumer app; the admin can view, edit contact/family details, suspend,
 * reactivate, or delete an account.
 */

/** Account lifecycle status. */
export type DevoteeStatus = 'Active' | 'Suspended'

/** A family member linked to the account (for pooja bookings). */
export interface FamilyMember {
  readonly name: string
  readonly nakshatra: string
}

/** Order/booking channel. */
export type BookingType = 'Pooja' | 'Store'

/** Union of every status seen across pooja bookings and store orders. */
export type BookingStatus =
  | 'Confirmed'
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'Shipped'
  | 'Delivered'
  | 'Partially Refunded'
  | 'Refunded'
  | 'Cancelled'

/** A single row in an account's booking/purchase history. */
export interface DevoteeBooking {
  readonly ref: string
  readonly date: string
  readonly type: BookingType
  readonly total: number
  readonly status: BookingStatus
}

/** A devotee (app user) account. */
export interface Devotee {
  readonly id: string
  readonly name: string
  readonly phone: string
  readonly email: string
  readonly status: DevoteeStatus
  /** ISO date the account was created. */
  readonly joined: string
  /** ISO date of the most recent app activity. */
  readonly lastActivity: string
  readonly family: readonly FamilyMember[]
  readonly bookings: readonly DevoteeBooking[]
}
