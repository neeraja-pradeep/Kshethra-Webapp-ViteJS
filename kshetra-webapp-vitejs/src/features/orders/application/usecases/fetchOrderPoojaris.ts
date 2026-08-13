import type { Result } from '@/core/error/result'
import type { OrderPersonRef } from '@/features/orders/domain/entities/pooja-order-detail'
import { orderRepository } from '@/features/orders/infrastructure/repositories/order.repository.impl'

export function fetchOrderPoojaris(): Promise<Result<readonly OrderPersonRef[]>> {
  return orderRepository.fetchPoojaris()
}
