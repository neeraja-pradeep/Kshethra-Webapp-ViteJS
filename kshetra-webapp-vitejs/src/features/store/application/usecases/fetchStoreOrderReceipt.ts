import type { Result } from '@/core/error/result'
import type { StoreReceipt } from '@/features/store/domain/entities/store-receipt'
import { storeOrderRepository } from '@/features/store/infrastructure/repositories/storeOrder.repository.impl'

export function fetchStoreOrderReceipt(orderId: number): Promise<Result<StoreReceipt>> {
  return storeOrderRepository.fetchStoreOrderReceipt(orderId)
}
