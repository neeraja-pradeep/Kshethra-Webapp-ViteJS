/**
 * The back office's order feed — `GET /admin/orders/all/`.
 *
 * This lives in `shared/` because **two features read the same endpoint**: the
 * Pooja Orders screen pins `?source=pooja`, the Store Orders screen pins
 * `?source=product`, and the row shape is identical either way. Keeping one
 * copy is what stops the two drifting apart on the subtleties that matter —
 * `summary.amount` already being net, `by_payment_status` omitting empty
 * statuses, and the ordering being fixed.
 *
 * An order is **one checkout**, however many poojas, family members and dates
 * it covers. That is the whole difference from a booking (`PoojaOrderLine`),
 * which is the unit the temple performs: this list has one row per payment,
 * with the occurrences underneath collapsed into `items` and counted in
 * `itemCount`. `Booking` is the other half of the same data — see the
 * `bookings` feature.
 *
 * The feed unions pooja orders with shop orders; the Pooja Orders screen pins
 * `source: 'pooja'`.
 */

/** Which table the row came from. */
export type OrderSource = 'pooja' | 'product'

/** How the order reached the temple. Shop orders are always `app`. */
export type OrderChannel = 'app' | 'counter'

/**
 * Derived server-side, one vocabulary across both tables. A refund outranks
 * everything else — it is what the money did last.
 *
 * `awaitingCounterPayment` is **not** late: the arrangement on an agent-code
 * booking is that the devotee pays at the desk. Rendering it as `pending`
 * reads as overdue and is wrong.
 */
export type OrderPaymentStatus =
  | 'paid'
  | 'pending'
  | 'awaiting_counter_payment'
  | 'failed'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded'
  | 'partially_refunded'

/** Execution state rolled up from the order's bookings. Null on shop orders. */
export type OrderPoojaStatus = 'pending' | 'completed' | 'cancelled'

/** Gateway refund lifecycle. Distinct from money settled by hand — see `reconciledAmount`. */
export type OrderRefundStatus = 'none' | 'pending' | 'processed' | 'failed'

/**
 * The account the order sits under. On a counter walk-in this is the payer
 * snapshot off the receipt, with a null `id` — `order.user` there is the staff
 * member who rang it up, not the devotee.
 */
export interface OrderCustomer {
  readonly id: number | null
  readonly name: string
  readonly email: string
  readonly phone: string
}

/** The booking-agent code applied at checkout. Always null on shop orders. */
export interface OrderAgentCode {
  readonly id: number
  readonly name: string
}

/** One pooja on the order, with its occurrences collapsed — "2 × Satyanarayana Pooja". */
export interface OrderItem {
  readonly name: string
  readonly quantity: number
  readonly amount: number
}

/** Present only on a counter sale, or an app order settled at the desk. */
export interface OrderCounter {
  /** Null on a shop walk-in — its number lives on the order, not a receipt row. */
  readonly receiptId: number | null
  readonly receiptNo: string
  /** `walk_in`, or `agent_booking` for an app order paid at the counter. */
  readonly saleType: string
  readonly paymentMethod: string
  readonly status: string
  /** Who took the money. Empty when the account has no name or email. */
  readonly staffName: string
}

/** One row in the Pooja Orders list — one order, one checkout. */
export interface OrderListRow {
  readonly source: OrderSource
  /** Primary key **within its table** — only unique alongside `source`. */
  readonly id: number
  /** `PO-<id>` for pooja, `SO-<id>` for shop. What the admin sees and searches. */
  readonly reference: string
  /** Legacy per-checkout marker. One order per group now; group on it only for old data. */
  readonly orderGroupId: string | null
  readonly channel: OrderChannel
  readonly customer: OrderCustomer | null
  /** The stored order status, as opposed to the derived `paymentStatus`. */
  readonly status: string
  readonly poojaStatus: OrderPoojaStatus | null
  readonly paymentStatus: OrderPaymentStatus
  readonly paymentMethod: string
  /** Excludes `additionalCharges`, which only the detail payload carries. */
  readonly total: number
  readonly refundStatus: OrderRefundStatus
  /** Gateway refunds only. Money settled by hand is not counted here. */
  readonly refundAmount: number
  /** Occurrences: poojas × people × dates, or units on a shop order. */
  readonly itemCount: number
  /** How many *different* poojas. One pooja for a family of four is `4` / `1`. */
  readonly distinctItemCount: number
  readonly agentCode: OrderAgentCode | null
  readonly items: readonly OrderItem[]
  readonly counter: OrderCounter | null
  /** When the order was placed — what the feed sorts and date-filters on. */
  readonly createdAt: string
}

/**
 * The tiles above the table, counted over the **whole filtered set, not the
 * page** — an admin filtering to a week wants that week's takings, and a figure
 * that moved as you paged would be worthless.
 */
export interface OrdersSummary {
  /** How many orders matched. */
  readonly total: number
  /**
   * Takings, not billings, and **already net**: the server subtracts refunds
   * and reconciled amounts. Do not subtract `refunds.amount` from it a second
   * time, and never re-derive it by summing the `total` column — that column is
   * gross, and only the current page is loaded.
   */
  readonly amount: number
  /**
   * Gateway refunds only. An order given back entirely by reconciliation drops
   * out of `amount` but is not counted here.
   */
  readonly refunds: {
    readonly count: number
    readonly amount: number
  }
  /**
   * One count per status **present** — statuses with no orders are omitted.
   * Render a `0` tile from the keys you expect, not from the keys you get.
   */
  readonly byPaymentStatus: Partial<Record<OrderPaymentStatus, number>>
}

/** Every status the payment-status filter accepts, in the order the tiles read. */
export const ORDER_PAYMENT_STATUSES: readonly OrderPaymentStatus[] = [
  'paid',
  'pending',
  'awaiting_counter_payment',
  'failed',
  'cancelled',
  'refund_pending',
  'partially_refunded',
  'refunded',
] as const

const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  awaiting_counter_payment: 'Awaiting counter payment',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refund_pending: 'Refund pending',
  partially_refunded: 'Partially refunded',
  refunded: 'Refunded',
}

export function orderPaymentStatusLabel(status: OrderPaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status]
}

/** A walk-in devotee has no account, so the payer came off the receipt. */
export function isWalkIn(row: OrderListRow): boolean {
  return row.channel === 'counter' && row.customer?.id == null
}
