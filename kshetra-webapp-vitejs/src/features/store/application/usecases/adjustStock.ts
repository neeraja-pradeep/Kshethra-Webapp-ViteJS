import type { Result } from '@/core/error/result'
import type { ProductDetail } from '@/features/store/domain/entities/product'
import type { StockAdjustmentInput } from '@/features/store/domain/entities/stock-adjustment'
import { productRepository } from '@/features/store/infrastructure/repositories/product.repository.impl'

export function adjustStock(productId: number, input: StockAdjustmentInput): Promise<Result<ProductDetail>> {
  return productRepository.adjustStock(productId, input)
}
