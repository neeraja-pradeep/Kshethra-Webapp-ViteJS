import type { Result } from '@/core/error/result'
import type { FulfilmentStatus, StoreOrderDetail } from '@/features/store/domain/entities/store-order'
import { storeOrderRepository } from '@/features/store/infrastructure/repositories/storeOrder.repository.impl'

/** One step at a time — offer only `fulfilment.nextStatuses`. */
export function setFulfilmentStatus(orderId: number, status: FulfilmentStatus): Promise<Result<StoreOrderDetail>> {
  return storeOrderRepository.setFulfilmentStatus(orderId, status)
}
