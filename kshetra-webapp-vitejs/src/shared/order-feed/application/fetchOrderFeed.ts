import type { Result } from '@/core/error/result'
import type { OrderFilters, OrderPage } from '@/shared/order-feed/domain/order-feed.repository'
import { orderFeedRepository } from '@/shared/order-feed/infrastructure/orderFeed.repository.impl'

export function fetchOrderFeed(filters?: OrderFilters): Promise<Result<OrderPage>> {
  return orderFeedRepository.fetchOrders(filters)
}
