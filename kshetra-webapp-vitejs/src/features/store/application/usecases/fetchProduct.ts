import type { Result } from '@/core/error/result'
import type { ProductDetail } from '@/features/store/domain/entities/product'
import { productRepository } from '@/features/store/infrastructure/repositories/product.repository.impl'

export function fetchProduct(productId: number): Promise<Result<ProductDetail>> {
  return productRepository.fetchProduct(productId)
}
