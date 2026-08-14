/** A pooja (seva) offered by the temple, with its pricing and availability. */

export type PoojaStatus = 'Active' | 'Inactive'

/** A god as a pooja carries it — enough to render, not the whole record. */
export interface GodBrief {
  readonly id: number
  readonly name: string
  readonly mediaUrl: string | null
  readonly homeMediaUrl: string | null
  readonly sortOrder: number
}

/**
 * A published date a special pooja may be booked on.
 *
 * Its prices override the pooja's for that day. There is deliberately no
 * incentive here: `poojariIncentive` is a property of the pooja and is
 * snapshotted onto each order line, so it cannot vary by date.
 */
export interface SpecialPoojaDate {
  readonly id: number
  readonly date: string
  /** Optional time of day, `HH:MM:SS`. Empty when the date carries none. */
  readonly time: string
  readonly onlinePrice: number | null
  readonly offlinePrice: number | null
  /** Promotes this date to the app's banner. */
  readonly banner: boolean
}

/**
 * A day or range the pooja cannot be performed. A block outranks everything
 * that says otherwise — a recurring rule, a published date, the cart, the
 * counter — but it never cancels a booking already taken.
 */
export interface PoojaBlock {
  readonly id: number
  readonly startDate: string
  /** Equal to `startDate` for a single-day block. */
  readonly endDate: string
  readonly days: number
  readonly reason: string
  readonly createdByName: string
  readonly createdAt: string
}

export interface Pooja {
  readonly id: number
  readonly name: string
  /** Ordered; the first is the primary god, mirrored onto the legacy category. */
  readonly gods: readonly GodBrief[]
  readonly godIds: readonly number[]
  readonly godNames: readonly string[]
  readonly offlinePrice: number
  readonly onlinePrice: number
  /** What the poojari is paid per booking. Zero means "no incentive", rendered `—`. */
  readonly poojariIncentive: number
  readonly status: PoojaStatus
  readonly special: boolean
  readonly sortOrder: number
  readonly bannerDesc: string
  readonly cardDesc: string
  readonly captionsDesc: string
  readonly mediaUrl: string | null
  readonly bannerUrl: string | null
  /** Upcoming, active, unblocked dates only. Always empty for a regular pooja. */
  readonly specialPoojaDates: readonly SpecialPoojaDate[]
  /** Blocks that have not yet passed. */
  readonly unavailableDates: readonly PoojaBlock[]
}

/** Counted over the filters, never over the page. */
export interface PoojasSummary {
  readonly total: number
  readonly active: number
  readonly inactive: number
  readonly special: number
  /** What *Display order* pre-fills with. Deliberately not filtered. */
  readonly nextSortOrder: number
}

export function poojaIsActive(status: PoojaStatus): boolean {
  return status === 'Active'
}

export function poojaStatusFromActive(isActive: boolean): PoojaStatus {
  return isActive ? 'Active' : 'Inactive'
}

/** Zero is "no incentive" — there is no null state. */
export function hasIncentive(pooja: Pooja): boolean {
  return pooja.poojariIncentive > 0
}
