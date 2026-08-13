import type { Result } from '@/core/error/result'
import { productRepository } from '@/features/store/infrastructure/repositories/product.repository.impl'

export function deleteProduct(productId: number): Promise<Result<void>> {
  return productRepository.deleteProduct(productId)
}
