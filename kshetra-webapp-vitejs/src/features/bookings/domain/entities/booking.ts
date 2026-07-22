/**
 * Pooja Bookings — execution view. One row per person, per pooja date
 * (a single "booking" may cover several people and/or several dates; this
 * entity is already denormalized to that per-person row).
 */

/** How the booking reached the temple. */
export type BookingChannel = 'Counter' | 'Mobile app'

/** Coarse execution state shown in the KPI band and the status pill. */
export type BookingStatus = 'Pending' | 'Completed' | 'Cancelled'

/** Payment state of the parent order line for this booking. */
export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded' | 'Partially Refunded'

/** Tone driving a status pill's dot + text colour. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface Booking {
  /** Unique row key: `${bookingId}:${personIndex}`. */
  readonly id: string
  /** The underlying booking this person-row belongs to (shares a date + pooja). */
  readonly bookingId: string
  readonly poojaName: string
  /** Denormalized god display name (feature stays self-contained). */
  readonly godName: string
  /** Whether this pooja is flagged "special" in the catalogue. */
  readonly special: boolean
  /** ISO date (yyyy-mm-dd) the pooja is to be performed. */
  readonly poojaDate: string
  readonly person: string
  readonly nakshatra: string
  readonly channel: BookingChannel
  /** Counter staff who took the booking — set only when channel is "Counter". */
  readonly counterStaff: string | null
  /** Devotee's app account name — set only when channel is "Mobile app". */
  readonly devoteeAccountName: string | null
  readonly poojari: string
  readonly status: BookingStatus
  readonly statusTone: StatusTone
  readonly orderRef: string
  readonly paymentStatus: PaymentStatus
  readonly paymentTone: StatusTone
  /** Price of this pooja occurrence. */
  readonly amount: number
  readonly receiptRef: string
  /** Total value of every line on the parent order (across poojas/dates). */
  readonly orderTotal: number
}
