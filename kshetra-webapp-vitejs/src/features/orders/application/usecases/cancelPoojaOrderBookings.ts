import type { Result } from '@/core/error/result'
import type { OrderDetail } from '@/features/orders/domain/entities/pooja-order-detail'
import { orderRepository } from '@/features/orders/infrastructure/repositories/order.repository.impl'

/** Reconciliation only — no refund is sent to the gateway. `reason` is optional here. */
export function cancelPoojaOrderBookings(
  orderId: number,
  orderLineIds: readonly number[],
  reason?: string,
): Promise<Result<OrderDetail>> {
  return orderRepository.cancelPoojaOrderBookings(orderId, orderLineIds, reason)
}
