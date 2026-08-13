import type { Result } from '@/core/error/result'
import type { StoreOrderDetail } from '@/features/store/domain/entities/store-order'
import { storeOrderRepository } from '@/features/store/infrastructure/repositories/storeOrder.repository.impl'

export function fetchStoreOrder(orderId: number): Promise<Result<StoreOrderDetail>> {
  return storeOrderRepository.fetchStoreOrder(orderId)
}
