import type { BookingsTrendPoint, CounterCollectionPoint } from './chart-series-point'

/**
 * Everything `GET admin/dashboard/data/` returns, in the app's own vocabulary.
 *
 * One entity rather than six because the server counts all six against a single
 * `date` read once — a request served across midnight cannot report one card's
 * today and another's tomorrow, and splitting them here would throw that
 * guarantee away.
 */

/** *Online + counter combined.* The forward-looking half of the screen. */
export interface PoojaBookingsSnapshot {
  /** Bookings scheduled for today — the same value as `trend[0].count`. */
  readonly today: number
  /** Always 7 points, **today first**. */
  readonly trend: readonly BookingsTrendPoint[]
  /** Sent by the server so the card need not re-add the series. */
  readonly nextSevenDaysTotal: number
  /** Pooja order revenue since the 1st, net of refunds. */
  readonly collectedThisMonth: number
}

/** *Money taken at the desk.* Cancelled receipts are excluded throughout. */
export interface CounterBookingsSnapshot {
  readonly collectionToday: number
  readonly receiptsToday: number
  /** Pooja occurrences settled today — people × dates, not receipts. */
  readonly poojasBookedToday: number
  /** Always 7 points, **today last** — a receipt has no future to plot. */
  readonly collections: readonly CounterCollectionPoint[]
  readonly collectedThisMonth: number
}

/**
 * Every fulfilment status, zero-filled. The server always sends all seven so a
 * card rendering a fixed set of rows never has to guess whether a missing key
 * means zero or means the backend forgot.
 */
export interface StoreFulfilmentCounts {
  readonly pending: number
  readonly confirmed: number
  readonly processing: number
  readonly packed: number
  readonly shipped: number
  readonly delivered: number
  readonly cancelled: number
}

/**
 * A snapshot of the shop's queue over its most recent `window` orders — not a
 * period total, which is why the card is labelled "last 15 orders".
 */
export interface StoreOrdersSnapshot {
  /** How many orders were counted: 15, or fewer if the shop has fewer. */
  readonly window: number
  readonly fulfilment: StoreFulfilmentCounts
  /**
   * `confirmed + processing + packed + shipped`. Excludes `pending` (payment
   * has not landed, so the shop cannot start) as well as the two finished
   * states — so `open + delivered + cancelled` need **not** equal `window`.
   * Use `fulfilment` when the parts have to add up.
   */
  readonly open: number
  readonly delivered: number
  readonly cancelled: number
}

/**
 * *Work that has stopped moving.* Two independent counts of bookings the back
 * office still owes an action on.
 *
 * They **overlap on purpose**: a booking assigned yesterday for yesterday is
 * both awaiting and overdue, and is counted in both. Never add or subtract them
 * — that would report fewer stuck bookings than there are.
 */
export interface PoojariManagementSnapshot {
  /** The booking's day has passed (calendar day, Asia/Kolkata) and it is still pending. */
  readonly awaitingCompletion: number
  /** Its 24-hour assignment window has lapsed. An unassigned booking can never be overdue. */
  readonly overdue: number
}

/** The same three tiles the App > Devotees screen puts above its table. */
export interface DevoteesSnapshot {
  readonly total: number
  readonly active: number
  readonly suspended: number
}

export interface DashboardSnapshot {
  /** The server's day in Asia/Kolkata, read once for every card below. */
  readonly date: string
  readonly poojaBookings: PoojaBookingsSnapshot
  readonly counterBookings: CounterBookingsSnapshot
  readonly storeOrders: StoreOrdersSnapshot
  readonly poojariManagement: PoojariManagementSnapshot
  /**
   * `null` means **"not yours to see"** — the caller lacks `rbac.view_devotees`.
   * Hide the card; do not render it as zero. Only a custom role built in the
   * role editor ever sees this, since Admin and Manager hold both permissions.
   */
  readonly devotees: DevoteesSnapshot | null
}
