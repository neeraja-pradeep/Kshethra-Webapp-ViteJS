import type { Result } from '@/core/error/result'
import type { ProductRow, ProductWritableStatus } from '@/features/store/domain/entities/product'
import { productRepository } from '@/features/store/infrastructure/repositories/product.repository.impl'

export function setProductStatus(productId: number, status: ProductWritableStatus): Promise<Result<ProductRow>> {
  return productRepository.setProductStatus(productId, status)
}
