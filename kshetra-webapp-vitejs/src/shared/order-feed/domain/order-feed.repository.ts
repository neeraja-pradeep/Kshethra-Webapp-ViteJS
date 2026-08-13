import type { Result } from '@/core/error/result'
import type {
  OrderChannel,
  OrderListRow,
  OrderPaymentStatus,
  OrderPoojaStatus,
  OrderSource,
  OrdersSummary,
} from '@/shared/order-feed/domain/order-feed'

/**
 * Every filter here is applied by the server. Nothing is filtered client-side:
 * the list is paged and its tiles are counted over the whole filtered set, so
 * narrowing one page would report a page total as if it were the feed.
 */
export interface OrderFilters {
  /** Omit for both tables. The Pooja Orders screen pins `pooja`. */
  readonly source?: OrderSource
  /** `counter` returns pooja rows only — the shop has no counter channel. */
  readonly channel?: OrderChannel
  /** The tile click-through: every key in `summary.byPaymentStatus` is valid here. */
  readonly paymentStatus?: OrderPaymentStatus
  /** Pooja rows only; shop orders drop out of the result entirely. */
  readonly poojaStatus?: OrderPoojaStatus
  /** An `AgentCode` id. Pooja rows only — the shop takes no agent codes. */
  readonly agentCode?: number
  /** Exact match on the stored order status, not the derived payment status. */
  readonly status?: string
  readonly paymentMethod?: string
  /**
   * ISO `yyyy-mm-dd`, inclusive, on **`created_at`** — when the order was
   * placed, *not* when a pooja is to be performed. To filter by the work the
   * temple has to do, use the bookings feed, whose window runs on the pooja
   * date.
   */
  readonly dateFrom?: string
  readonly dateTo?: string
  /**
   * Matches the order reference (`PO-2041`, `po-2041` or the bare `2041`),
   * customer name/email/phone, the counter receipt number and walk-in payer,
   * and the pooja name.
   *
   * A bare number is one clause among many — it matches `PO-4` *and* any phone
   * containing a 4 — so send the prefixed reference when you mean the reference.
   */
  readonly search?: string
  readonly page?: number
  /** Max 100 server-side. */
  readonly pageSize?: number
}

/**
 * A page of the feed, plus tiles counted over the whole filtered set.
 *
 * There is no `sort`: ordering is fixed at newest first. The two tables are
 * unioned and paged in the database, so only the rows on the requested page are
 * ever loaded.
 */
export interface OrderPage {
  readonly count: number
  readonly results: readonly OrderListRow[]
  readonly summary: OrdersSummary
}

export interface OrderFeedRepository {
  fetchOrders(filters?: OrderFilters): Promise<Result<OrderPage>>
}
