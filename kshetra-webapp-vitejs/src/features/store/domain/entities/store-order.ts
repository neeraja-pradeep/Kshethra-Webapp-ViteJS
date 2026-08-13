/**
 * One shop order, in full.
 *
 * The shop's payloads deliberately speak the same shapes as the pooja ones —
 * the detail block, the receipt and `settlement` all read the same way — so the
 * two order screens stay recognisable to each other. What differs is the middle:
 * a shop order has `items[]` of variants and a **fulfilment flow**, where a
 * pooja order has poojas, dates and poojaris.
 */

import type { OrderChannel, OrderCounter, OrderCustomer } from '@/shared/order-feed/domain/order-feed'

/** The stored fulfilment status. `delivered` is terminal. */
export type FulfilmentStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

/** Derived, and one value wider than the pooja side: the shop can fail a payment. */
export type StoreOrderPaymentStatus =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded'
  | 'partially_refunded'

export type StoreRefundStatus = 'none' | 'pending' | 'processed' | 'failed'

/** Tender types the counter accepts. Never `razorpay` or `cod` — see §8. */
export type WalkInPaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking'

export interface StoreOrderAddress {
  readonly name: string
  readonly line1: string
  readonly line2: string
  readonly city: string
  readonly state: string
  readonly pincode: string
  readonly phone: string
}

/** One line of the order. A variant is what is actually sold, not a product. */
export interface StoreOrderItem {
  readonly id: number
  readonly variantId: number | null
  readonly sku: string
  /** `"<product> - <variant>"`, because two size lines would otherwise look identical. */
  readonly name: string
  readonly productName: string
  readonly variantName: string
  readonly category: string
  readonly imageUrl: string | null
  readonly quantity: number
  /** Captured when the order was placed — it does not follow the catalogue. */
  readonly unitPrice: number
  readonly amount: number
}

export interface StoreReceiptRef {
  readonly receiptNo: string
  readonly source: 'counter' | 'derived'
}

export interface StoreOrderPayment {
  /** What was charged — on an app order this includes the delivery fee. */
  readonly total: number
  readonly paymentStatus: StoreOrderPaymentStatus
  readonly paymentMethod: string
  readonly paymentMethodDisplay: string
  readonly refundStatus: StoreRefundStatus
  /** Accumulated across every refund, not just the last one. */
  readonly refundAmount: number
  readonly refundReference: string | null
  /** What is left to give back. **Caps the next refund** — not the order total. */
  readonly refundableAmount: number
  readonly receipt: StoreReceiptRef | null
}

/**
 * The fulfilment flow, as the server reports it.
 *
 * `nextStatuses` is read from the same table the endpoint checks against, so
 * the client never encodes the sequence: enable buttons from this and an
 * illegal step cannot be offered, let alone sent.
 */
export interface StoreFulfilment {
  readonly status: FulfilmentStatus
  readonly statusDisplay: string
  readonly nextStatuses: readonly FulfilmentStatus[]
  readonly canCancel: boolean
}

export interface StoreOrderCancellation {
  readonly cancelled: boolean
  readonly reason: string | null
  readonly cancelledAt: string | null
  readonly cancelledBy: string | null
  readonly canCancel: boolean
  readonly cancellableAmount: number
}

/** How a cancellation or refund moved the money. Returned by those two only. */
export interface StoreSettlement {
  /** `gateway` through Razorpay, `counter` handed back at the desk, `none` owed nothing. */
  readonly method: 'gateway' | 'counter' | 'none'
  readonly amount: number
  readonly reference: string | null
}

export interface StoreOrderDetail {
  readonly source: 'product'
  readonly id: number
  readonly reference: string
  readonly channel: OrderChannel
  readonly channelDisplay: string
  readonly status: string
  readonly customer: OrderCustomer | null
  readonly counter: OrderCounter | null
  /** Null on a counter sale — nothing is delivered. */
  readonly shippingAddress: StoreOrderAddress | null
  readonly billingAddress: StoreOrderAddress | null
  /** Units bought. */
  readonly itemCount: number
  /** How many different variants. */
  readonly distinctItemCount: number
  readonly items: readonly StoreOrderItem[]
  readonly payment: StoreOrderPayment
  readonly fulfilment: StoreFulfilment
  readonly cancellation: StoreOrderCancellation
  readonly createdAt: string
  /** Only on a cancel or refund response. */
  readonly settlement: StoreSettlement | null
  /** Only on a cancel: whether the goods went back on the shelf. */
  readonly restocked: boolean | null
}

const FULFILMENT_LABELS: Record<FulfilmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

/** The happy path, for drawing the progress rail. `cancelled` is not on it. */
export const FULFILMENT_FLOW: readonly FulfilmentStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
]

export function fulfilmentLabel(status: FulfilmentStatus): string {
  return FULFILMENT_LABELS[status]
}

/**
 * The steps a button may offer.
 *
 * `cancelled` is filtered out even when the server lists it: it moves money, so
 * it belongs to the cancel endpoint, which takes a reason and settles a refund.
 */
export function offerableNextStatuses(fulfilment: StoreFulfilment): readonly FulfilmentStatus[] {
  return fulfilment.nextStatuses.filter((status) => status !== 'cancelled')
}

/** Nothing left to give back means the refund form has nothing to do. */
export function canRefund(payment: StoreOrderPayment): boolean {
  return payment.refundableAmount > 0
}
