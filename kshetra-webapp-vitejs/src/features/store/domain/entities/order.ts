/** Store orders — fulfilment, payment, and refund records. */

/** Fulfilment lifecycle. 'Cancelled' is a terminal state outside the normal stage sequence. */
export type FulfilmentStage = 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled'

/** The normal, advanceable fulfilment sequence (excludes 'Cancelled'). */
export const FULFILMENT_STAGES: readonly FulfilmentStage[] = ['Processing', 'Packed', 'Shipped', 'Delivered']

/** All fulfilment values, including the terminal 'Cancelled' state — for filters. */
export const FULFILMENT_STATUSES: readonly FulfilmentStage[] = [
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
]

export type PaymentState = 'Paid' | 'Pending' | 'Refunded' | 'Partially Refunded'

export const PAYMENT_STATUSES: readonly PaymentState[] = ['Paid', 'Pending', 'Refunded', 'Partially Refunded']

/** A quantity of one product on an order. */
export interface OrderLineItem {
  readonly productId: string
  readonly quantity: number
}

/** An app account holder placing an order (absent for walk-in/counter sales). */
export interface OrderCustomer {
  readonly name: string
  readonly phone: string
  readonly email: string
}

export interface OrderAddress {
  readonly name: string
  readonly line1: string
  readonly line2: string
  readonly phone: string
}

export interface OrderRefundEntry {
  readonly kind: string
  readonly amount: number
  readonly reason: string
  readonly user: string
  readonly timestamp: string
}

export interface Order {
  readonly ref: string
  readonly id: string
  readonly customer: OrderCustomer | null
  /** Set only for walk-in (counter) orders, where there is no account holder. */
  readonly walkinName?: string
  readonly walkinPhone?: string
  readonly date: string // ISO yyyy-mm-dd
  readonly items: readonly OrderLineItem[]
  readonly paymentMethod: string
  readonly paymentStatus: PaymentState
  readonly fulfilmentStatus: FulfilmentStage
  readonly receiptRef: string
  readonly address: OrderAddress | null
  readonly refundLog: readonly OrderRefundEntry[]
}

/** A walk-in (over-the-counter) sale — no account holder, collected and delivered at the counter. */
export type WalkInOrder = Order & { readonly customer: null }

/** One line in an in-progress walk-in cart (before checkout produces an Order). */
export interface WalkInCartLine {
  readonly productId: string
  readonly quantity: number
}
