/**
 * Pooja Orders domain entities.
 *
 * An order groups every pooja "occurrence" (a single pooja, for one god, on
 * one scheduled date) booked together and paid for in one transaction. The
 * list screen shows one row per order; the detail drawer groups an order's
 * occurrences back into per-pooja line items.
 */

/** How the order reached the temple. */
export type OrderChannel = 'Counter' | 'Mobile app'

/** Payment lifecycle for the whole order. */
export type OrderPaymentStatus = 'Paid' | 'Pending' | 'Refunded' | 'Partially Refunded'

/** Underlying record status of one scheduled pooja occurrence (also rolls up to the order). */
export type OrderRecordStatus = 'Pending' | 'Completed' | 'Cancelled'

/** Reconciliation state for a refund raised against a single occurrence. */
export type OccurrenceRefundState = 'none' | 'pending' | 'refunded'

/** A family member / devotee the pooja is performed for. */
export interface OrderPerson {
  readonly name: string
  readonly nakshatra: string
}

/** An in-flight reassignment of the officiating priest for one occurrence. */
export interface OrderReassignment {
  readonly priest: string
  /** ISO timestamp — the occurrence must be completed before this or the reassignment expires. */
  readonly deadline: string
}

/** One scheduled date within a pooja line item. */
export interface OrderOccurrence {
  readonly id: string
  /** ISO date, yyyy-mm-dd. */
  readonly date: string
  readonly poojari: string
  readonly recordStatus: OrderRecordStatus
  readonly refund: OccurrenceRefundState
  readonly reassignment: OrderReassignment | null
}

/** One pooja (for one god) within an order, with every date it was booked for. */
export interface OrderLineItem {
  readonly poojaName: string
  readonly godName: string
  /** Price per person, per date. */
  readonly basePrice: number
  readonly people: readonly OrderPerson[]
  readonly occurrences: readonly OrderOccurrence[]
}

/** One entry in an order's refund/cancellation reconciliation log. */
export interface OrderRefundLogEntry {
  readonly amount: number
  readonly reason: string
  readonly user: string
  /** Pre-formatted, e.g. "10 Jul 2026, 2:41 pm". */
  readonly timestamp: string
}

/** A pooja order — one row in the Pooja Orders list, denormalized for display. */
export interface Order {
  readonly id: string
  /** Order reference shown throughout the UI, e.g. "KP-2041". */
  readonly ref: string
  readonly devoteeName: string
  readonly phone: string
  readonly email: string
  readonly channel: OrderChannel
  readonly counterStaff: string | null
  readonly counterPaidMethod: string | null
  /** Booking-agent code applied at checkout, if any. */
  readonly agentCode: string | null
  /** How the order was paid, e.g. "UPI", "Card", "Counter — Cash". */
  readonly paymentMethod: string
  readonly paymentStatus: OrderPaymentStatus
  /** Pre-formatted booking timestamp, e.g. "29 Jun 2026, 8:15 am". */
  readonly bookedAt: string
  readonly receiptRef: string
  readonly lineItems: readonly OrderLineItem[]
  readonly refundLog: readonly OrderRefundLogEntry[]
}
