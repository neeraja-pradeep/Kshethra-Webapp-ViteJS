/**
 * Pooja Bookings — execution view.
 *
 * A booking is **one pooja, for one person, on one date** — a `PoojaOrderLine`
 * server-side. It is the unit the temple actually performs, which is why it
 * carries its own execution state rather than inheriting the order's:
 *
 * - `status` is the **work** (`pooja_status`): pending → completed / cancelled.
 * - `lineStatus` is the **money** (confirmed / cancelled / refunded).
 * - `poojari` is assigned per booking. Two poojas on one order routinely
 *   belong to two different poojaris, so the order's own poojari and status
 *   are roll-ups and must never be treated as the source of truth.
 */

/** How the booking reached the temple. */
export type BookingChannel = 'counter' | 'app'

/** Execution state — what the temple still has to do. */
export type BookingStatus = 'pending' | 'completed' | 'cancelled'

/** Money state of the line. Distinct from `BookingStatus`. */
export type LineStatus = 'confirmed' | 'cancelled' | 'refunded'

/** The person the pooja is performed for — a saved profile, or a counter snapshot. */
export interface BookingPerson {
  readonly name: string
  readonly nakshatram: string
}

export interface BookingPooja {
  readonly id: number
  readonly name: string
  readonly special: boolean
  /** Display names of the gods this pooja belongs to. */
  readonly godNames: readonly string[]
}

/** Who placed it: an app devotee, or the counter staff who rang it up. */
export interface BookingBookedBy {
  readonly name: string
  readonly phone: string
  /** Set only for counter bookings. */
  readonly staffName: string
}

export interface BookingPoojari {
  readonly id: number
  readonly name: string
}

/** The parent order, as much of it as this row needs. */
export interface BookingOrder {
  readonly receiptNo: string
  readonly total: number
  /** Free-form server value (`paid`, `cancelled`, `awaiting_counter_payment`, …). */
  readonly paymentStatus: string
  readonly paymentMethod: string
  readonly refundStatus: string
  readonly refundAmount: number
}

export interface Booking {
  /** `PoojaOrderLine` id — what the complete/assign endpoints take. */
  readonly id: number
  readonly orderId: number
  readonly orderReference: string
  readonly channel: BookingChannel
  readonly bookedBy: BookingBookedBy
  readonly pooja: BookingPooja
  /** ISO `yyyy-mm-dd`. Null when neither a date nor a special date resolves. */
  readonly poojaDate: string | null
  readonly poojaTime: string | null
  readonly person: BookingPerson
  /** Null until someone is rostered — the server can filter on exactly this. */
  readonly poojari: BookingPoojari | null
  readonly status: BookingStatus
  readonly lineStatus: LineStatus
  /**
   * Past its completion window. Nothing expires on its own — the back office is
   * shown the overdue booking and decides.
   */
  readonly isOverdue: boolean
  readonly completeBy: string | null
  readonly completedAt: string | null
  readonly assignedAt: string | null
  readonly price: number
  readonly remarks: string
  readonly order: BookingOrder
  readonly createdAt: string
}

/** Counts over the **whole filtered set**, not the loaded page. */
export interface BookingSummary {
  readonly total: number
  readonly pending: number
  readonly completed: number
  readonly cancelled: number
}

/** Only pending work can be recorded as performed. */
export function isCompletable(booking: Booking): boolean {
  return booking.status === 'pending'
}

/** The god shown next to the pooja name. */
export function primaryGodName(booking: Booking): string {
  return booking.pooja.godNames[0] ?? ''
}
