import type { Result } from '@/core/error/result'
import type { StoreOrderDetail } from '@/features/store/domain/entities/store-order'
import { storeOrderRepository } from '@/features/store/infrastructure/repositories/storeOrder.repository.impl'

/** Omit `amount` to send back the whole remainder. Capped at `refundableAmount`. */
export function refundStoreOrder(orderId: number, reason: string, amount?: number): Promise<Result<StoreOrderDetail>> {
  return storeOrderRepository.refundStoreOrder(orderId, reason, amount)
}
