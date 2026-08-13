import type { Result } from '@/core/error/result'
import type { OrderDetail } from '@/features/orders/domain/entities/pooja-order-detail'
import { orderRepository } from '@/features/orders/infrastructure/repositories/order.repository.impl'

export function assignOrderPoojari(
  orderId: number,
  orderLineIds: readonly number[],
  poojariId: number,
): Promise<Result<OrderDetail>> {
  return orderRepository.assignPoojari(orderId, orderLineIds, poojariId)
}
