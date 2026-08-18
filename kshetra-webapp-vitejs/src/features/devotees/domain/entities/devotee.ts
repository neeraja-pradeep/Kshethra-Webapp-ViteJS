/**
 * Devotee — a `CustomUser` whose role is `temple_user`, i.e. somebody who
 * signed up in the app. Staff and poojaris are the Users & Roles screen's
 * business and never appear here.
 *
 * Nothing on this screen creates an account, because nothing but signing up in
 * the app can, and nothing deletes one: the orders, receipts and bookings
 * behind a devotee have to stay attributable. Suspension is the only write.
 */

/** `is_active`, as the screen says it. Two values, not the four a staff account has. */
export type DevoteeStatus = 'active' | 'suspended'

/** The wire values are lower case; the table prints these. */
export const DEVOTEE_STATUS_LABEL: Record<DevoteeStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
}

/**
 * One row of the table.
 *
 * `familyCount`, `bookingCount` and `lastActivity` are computed by the server
 * in SQL rather than stored, which is what makes all three sortable — so the
 * list row carries the figures and not the records behind them. Those live on
 * {@link DevoteeDetail}.
 */
export interface Devotee {
  /** The `CustomUser` id. What the detail and status calls take. */
  readonly id: number
  /** `first_name last_name`, or the username when both are blank. */
  readonly name: string
  /** Exactly as stored — unformatted, and absent on a Firebase sign-in that carried none. */
  readonly phone: string | null
  readonly email: string | null
  /** Saved family profiles, the account holder included — so the smallest value is 1, not 0. */
  readonly familyCount: number
  /**
   * Non-cancelled `PoojaOrderLine` rows across every order: one pooja, for one
   * person, on one date. Counter walk-ins never land here.
   */
  readonly bookingCount: number
  /** The latest of their last pooja order, shop order or sign-in. Never null. */
  readonly lastActivity: string
  readonly status: DevoteeStatus
}

/** One of the saved profiles the devotee books for. */
export interface DevoteeFamilyMember {
  readonly id: number
  readonly name: string
  readonly dob: string | null
  readonly time: string | null
  /** True on the profile that is the account holder themselves. */
  readonly isSelf: boolean
  /** The profile's **active** attributes only. */
  readonly nakshatrams: readonly string[]
}

/** One pooja booking on the account — a line, not an order. */
export interface DevoteePoojaBooking {
  readonly id: number
  readonly orderId: number
  readonly pooja: string | null
  readonly date: string | null
  readonly bookedFor: string | null
  readonly status: string
  readonly poojaStatus: string
  readonly price: number
}

/** One shop order on the account. */
export interface DevoteeShopOrder {
  readonly id: number
  readonly status: string
  readonly paymentStatus: string
  readonly total: number
  readonly createdAt: string
}

/**
 * The row, plus what it is a summary *of*.
 *
 * `recentBookings` **does** include cancelled bookings, unlike `bookingCount`:
 * the count answers how much they have booked, the list answers what has
 * happened on the account. Both lists carry at most ten, newest first.
 */
export interface DevoteeDetail extends Devotee {
  readonly username: string
  readonly joinedAt: string
  readonly lastLogin: string | null
  readonly family: readonly DevoteeFamilyMember[]
  readonly recentBookings: readonly DevoteePoojaBooking[]
  readonly recentOrders: readonly DevoteeShopOrder[]
}

/**
 * The tiles above the table.
 *
 * Counted over the search but **not** over the status filter — a tile is how
 * that filter is applied, so counting it into its own total would zero the
 * other two the moment one was clicked. On an unfiltered screen
 * `active + suspended === total`.
 */
export interface DevoteeSummary {
  readonly total: number
  readonly active: number
  readonly suspended: number
}
