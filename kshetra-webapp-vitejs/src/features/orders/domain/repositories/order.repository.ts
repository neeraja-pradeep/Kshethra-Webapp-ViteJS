import type { Result } from '@/core/error/result'
import type { OrderDetail, OrderPersonRef } from '@/features/orders/domain/entities/pooja-order-detail'
import type { OrderFilters, OrderPage } from '@/shared/order-feed/domain/order-feed.repository'
import type { OrderReceipt } from '@/features/orders/domain/entities/pooja-receipt'

export interface OrderRepository {
  /** The feed, pinned to `source: 'pooja'` by the screen. Shared with the shop. */
  fetchOrders(filters?: OrderFilters): Promise<Result<OrderPage>>
  /** One order in full, by its `PoojaOrder` id. */
  fetchPoojaOrder(orderId: number): Promise<Result<OrderDetail>>
  /** The printable receipt — real on a counter sale, derived on an app order. */
  fetchPoojaOrderReceipt(orderId: number): Promise<Result<OrderReceipt>>
  /**
   * Cancels the whole order. `reason` is required and non-blank; it is recorded
   * on the order and copied onto every booking the cancellation calls off.
   *
   * How the money goes back depends on how it came in — through the gateway, as
   * a reconciliation entry, or not at all. The gateway is called *before*
   * anything is written, so a refund the provider refuses leaves the order
   * exactly as it was. Bookings already performed keep their money and their
   * completed status.
   *
   * Answers with the whole detail payload again, `settlement` filled in.
   */
  cancelPoojaOrder(orderId: number, reason: string): Promise<Result<OrderDetail>>
  /**
   * Cancels single dates off the order. `orderLineIds` are `orderLineId` values
   * from `poojas[].dates[].users[]`; `reason` is optional here.
   *
   * **No refund is processed.** A part cancellation is settled outside the
   * gateway, so the value is added to `reconciledAmount` and nothing is sent to
   * Razorpay. Only money the temple actually took can be owed back.
   *
   * All-or-nothing: one booking that cannot be cancelled fails the whole
   * request with nothing changed.
   */
  cancelPoojaOrderBookings(
    orderId: number,
    orderLineIds: readonly number[],
    reason?: string,
  ): Promise<Result<OrderDetail>>
  /**
   * Records the poojas as performed and hands back the reloaded order.
   *
   * This is a *booking*-level action reached from the order page: an admin
   * recording that a pooja happened is not claiming to have performed it, so
   * the assigned poojari keeps the booking. All-or-nothing, and completing an
   * already-completed booking is a no-op rather than an error.
   */
  completeBookings(orderId: number, orderLineIds: readonly number[]): Promise<Result<OrderDetail>>
  /**
   * Assigns the bookings to a poojari, restarting each one's 24-hour completion
   * window, and hands back the reloaded order.
   *
   * Assignment is per booking — reassigning one pooja leaves the others on the
   * order with whoever they had. Only a booking still waiting can be assigned;
   * a completed or cancelled one is a `400`.
   */
  assignPoojari(orderId: number, orderLineIds: readonly number[], poojariId: number): Promise<Result<OrderDetail>>
  /**
   * The roster the assign endpoint will accept — activated `temple_poojari`
   * accounts only. Offering anyone else would be an error the operator could
   * not have avoided.
   */
  fetchPoojaris(): Promise<Result<readonly OrderPersonRef[]>>
}
