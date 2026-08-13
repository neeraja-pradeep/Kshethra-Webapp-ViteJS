import type { Result } from '@/core/error/result'
import type { OrderFilters, OrderPage } from '@/shared/order-feed/domain/order-feed.repository'
import { orderRepository } from '@/features/orders/infrastructure/repositories/order.repository.impl'

export function fetchOrders(filters?: OrderFilters): Promise<Result<OrderPage>> {
  return orderRepository.fetchOrders(filters)
}
