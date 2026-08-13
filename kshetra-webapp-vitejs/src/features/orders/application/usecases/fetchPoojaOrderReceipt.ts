import type { Result } from '@/core/error/result'
import type { OrderReceipt } from '@/features/orders/domain/entities/pooja-receipt'
import { orderRepository } from '@/features/orders/infrastructure/repositories/order.repository.impl'

export function fetchPoojaOrderReceipt(orderId: number): Promise<Result<OrderReceipt>> {
  return orderRepository.fetchPoojaOrderReceipt(orderId)
}
