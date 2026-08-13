import type { Result } from '@/core/error/result'
import type { StoreOrderDetail } from '@/features/store/domain/entities/store-order'
import { storeOrderRepository } from '@/features/store/infrastructure/repositories/storeOrder.repository.impl'

/** `reason` is required. Settles the money and restocks anything unshipped. */
export function cancelStoreOrder(orderId: number, reason: string): Promise<Result<StoreOrderDetail>> {
  return storeOrderRepository.cancelStoreOrder(orderId, reason)
}
