import type { Result } from '@/core/error/result'
import type { OrderDetail } from '@/features/orders/domain/entities/pooja-order-detail'
import { orderRepository } from '@/features/orders/infrastructure/repositories/order.repository.impl'

export function fetchPoojaOrder(orderId: number): Promise<Result<OrderDetail>> {
  return orderRepository.fetchPoojaOrder(orderId)
}
