import type { Result } from '@/core/error/result'
import type { OrderDetail } from '@/features/orders/domain/entities/pooja-order-detail'
import { orderRepository } from '@/features/orders/infrastructure/repositories/order.repository.impl'

export function completeOrderBookings(orderId: number, orderLineIds: readonly number[]): Promise<Result<OrderDetail>> {
  return orderRepository.completeBookings(orderId, orderLineIds)
}
