/**
 * One pooja order, in full — everything the order detail page draws.
 *
 * The payload keeps the checkout's shape: `poojas[] → dates[] → users[]`,
 * where **one `users[]` entry is one booking** (`PoojaOrderLine`) — the thing
 * that is assigned to a poojari, performed, and cancellable on its own.
 * `orderLineId` is the id every write on this page takes.
 */

import type {
  OrderAgentCode,
  OrderChannel,
  OrderCounter,
  OrderCustomer,
  OrderPaymentStatus,
  OrderPoojaStatus,
  OrderRefundStatus,
} from '@/shared/order-feed/domain/order-feed'

/** Money state of one booking. Distinct from its execution state. */
export type OrderLineStatus = 'confirmed' | 'cancelled' | 'refunded'

/** Who placed the order. On a walk-in, `staffName` is who rang it up. */
export interface OrderBookedBy {
  readonly name: string
  readonly phone: string
  /** Set only on a counter order. */
  readonly staffName: string
}

/** A person a pooja is performed for. */
export interface OrderDevotee {
  readonly name: string
  readonly nakshatram: string
}

export interface OrderPersonRef {
  readonly id: number
  readonly name: string
}

export interface OrderGod {
  readonly id: number
  readonly name: string
  readonly mediaUrl: string | null
}

export interface OrderPoojaCategory {
  readonly id: number
  readonly name: string
}

export interface OrderPoojaInfo {
  readonly id: number
  readonly name: string
  readonly category: OrderPoojaCategory | null
  /** Primary god first. */
  readonly gods: readonly OrderGod[]
  readonly onlinePrice: number
  readonly offlinePrice: number
  readonly specialPooja: boolean
  readonly mediaUrl: string | null
}

/**
 * One booking. Its own execution state, because assignment is per booking —
 * two poojas in one order routinely belong to two different poojaris.
 */
export interface OrderBooking {
  /** `PoojaOrderLine` id — what complete, assign and cancel-bookings all take. */
  readonly orderLineId: number
  readonly userList: OrderPersonRef | null
  readonly userAttribute: string | null
  readonly devotee: OrderDevotee
  /** This booking's share of the order. */
  readonly price: number
  readonly lineStatus: OrderLineStatus
  readonly poojaStatus: OrderPoojaStatus
  readonly poojari: OrderPersonRef | null
  /**
   * Who handed it to them. Null when no admin has touched it — a poojari who
   * picked the booking up themselves, and who is therefore not on the clock.
   */
  readonly assignedBy: OrderPersonRef | null
  /** A non-null value is what tells the page this poojari was *put* here. */
  readonly assignedAt: string | null
  /** `assignedAt` + 24 hours. Null when no admin assigned it. */
  readonly completeBy: string | null
  /** Past `completeBy` and still not performed. Nothing expires on its own. */
  readonly isOverdue: boolean
  readonly completedAt: string | null
  readonly cancelledAt: string | null
  readonly cancelReason: string | null
}

/** One scheduled date within a pooja, with every booking standing on it. */
export interface OrderDate {
  readonly orderId: number
  readonly orderStatus: string
  /** Rolled up from this date's bookings. */
  readonly poojaStatus: OrderPoojaStatus
  /** The order-wide roll-up, repeated on every date by the server. */
  readonly orderPoojaStatus: OrderPoojaStatus
  readonly orderTotal: number
  readonly additionalCharges: number
  readonly selectedDate: string | null
  readonly specialPoojaDate: string | null
  readonly users: readonly OrderBooking[]
}

/** One pooja on the order, across every date it was booked for. */
export interface OrderPoojaGroup {
  readonly pooja: OrderPoojaInfo
  readonly poojaTotal: number
  readonly dates: readonly OrderDate[]
}

export interface OrderReceiptRef {
  readonly receiptNo: string
  /** `counter` for a real receipt on file, `derived` for one composed from the order. */
  readonly source: 'counter' | 'derived'
}

export interface OrderPayment {
  readonly total: number
  readonly additionalCharges: number
  readonly grandTotal: number
  readonly paymentStatus: OrderPaymentStatus
  readonly paymentMethod: string
  readonly paymentMethodDisplay: string
  readonly razorpayOrderId: string | null
  readonly razorpayPaymentId: string | null
  readonly refundStatus: OrderRefundStatus
  /** What the gateway was asked to send back. `refundStatus` says whether it settled. */
  readonly refundAmount: number
  readonly refundReason: string | null
  /**
   * Money written off the order for a payout made **outside** the gateway —
   * cash back at the desk, a bank transfer. Nothing settles it automatically;
   * it is a record for the books.
   */
  readonly reconciledAmount: number
  /**
   * What is left: `total + additionalCharges − refundAmount − reconciledAmount`.
   * Both count against it, so an order cannot be paid back twice.
   */
  readonly refundableAmount: number
  readonly receipt: OrderReceiptRef | null
}

export interface OrderCancellation {
  readonly cancelled: boolean
  readonly reason: string | null
  readonly cancelledAt: string | null
  readonly cancelledBy: string | null
  readonly canCancel: boolean
  /**
   * What pressing cancel would send back **right now** — not always the order
   * total. It is `0` on an order whose money was never collected and on one
   * whose poojas have all been performed; both can still be cancelled, they
   * simply owe nothing.
   */
  readonly cancellableAmount: number
}

/** How a cancellation moved the money. Returned on the two write endpoints only. */
export interface OrderSettlement {
  /** `gateway` refunded through Razorpay, `reconciliation` paid by hand, `none` owed nothing. */
  readonly method: 'gateway' | 'reconciliation' | 'none'
  readonly amount: number
  readonly reference: string | null
  /** Set by cancel-bookings — which bookings were called off. */
  readonly bookingIds: readonly number[] | null
}

export interface OrderDetail {
  readonly source: 'pooja'
  readonly id: number
  readonly reference: string
  readonly orderGroupId: string | null
  readonly channel: OrderChannel
  readonly channelDisplay: string
  readonly createdAt: string
  readonly status: string
  readonly poojaStatus: OrderPoojaStatus | null
  readonly customer: OrderCustomer | null
  readonly bookedBy: OrderBookedBy | null
  /** The people the poojas are for, deduplicated — one person on three dates is one chip. */
  readonly bookedFor: readonly OrderDevotee[]
  readonly agentCode: OrderAgentCode | null
  readonly counter: OrderCounter | null
  /** An agent-code booking settled at the desk. Not overdue. */
  readonly awaitingCounterPayment: boolean
  /** Bookings on the order: poojas × people × dates. */
  readonly itemCount: number
  readonly poojas: readonly OrderPoojaGroup[]
  readonly payment: OrderPayment
  readonly cancellation: OrderCancellation
  /** Only on the response to a cancel — absent on a plain `GET`. */
  readonly settlement: OrderSettlement | null
}

/** Every booking on the order, flattened out of `poojas[] → dates[] → users[]`. */
export function allBookings(detail: OrderDetail): readonly OrderBooking[] {
  return detail.poojas.flatMap((group) => group.dates.flatMap((date) => date.users))
}

/**
 * Only a booking still standing can be cancelled off the order. A performed one
 * keeps its money and its status; an already-cancelled one is a `400`.
 */
export function isCancellable(booking: OrderBooking): boolean {
  return booking.lineStatus === 'confirmed' && booking.poojaStatus === 'pending'
}

/** What cancelling the given bookings would reconcile — the server computes its own figure. */
export function bookingsAmount(detail: OrderDetail, orderLineIds: ReadonlySet<number>): number {
  return allBookings(detail)
    .filter((booking) => orderLineIds.has(booking.orderLineId))
    .reduce((sum, booking) => sum + booking.price, 0)
}
