import type { Result } from '@/core/error/result'
import type { OrderDetail } from '@/features/orders/domain/entities/pooja-order-detail'
import { orderRepository } from '@/features/orders/infrastructure/repositories/order.repository.impl'

/** `reason` is required and non-blank — the server records it on every booking called off. */
export function cancelPoojaOrder(orderId: number, reason: string): Promise<Result<OrderDetail>> {
  return orderRepository.cancelPoojaOrder(orderId, reason)
}
