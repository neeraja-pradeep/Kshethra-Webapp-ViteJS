import type { Result } from '@/core/error/result'
import type { StockAdjustmentEntry } from '@/features/store/domain/entities/stock-adjustment'
import { productRepository } from '@/features/store/infrastructure/repositories/product.repository.impl'

export function fetchStockHistory(productId: number): Promise<Result<readonly StockAdjustmentEntry[]>> {
  return productRepository.fetchStockHistory(productId)
}
