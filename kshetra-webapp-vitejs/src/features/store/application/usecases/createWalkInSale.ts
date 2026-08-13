import type { Result } from '@/core/error/result'
import type { StoreOrderDetail } from '@/features/store/domain/entities/store-order'
import type { WalkInSale } from '@/features/store/domain/repositories/storeOrder.repository'
import { storeOrderRepository } from '@/features/store/infrastructure/repositories/storeOrder.repository.impl'

export function createWalkInSale(sale: WalkInSale): Promise<Result<StoreOrderDetail>> {
  return storeOrderRepository.createWalkInSale(sale)
}
