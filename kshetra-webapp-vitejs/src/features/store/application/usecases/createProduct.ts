import type { Result } from '@/core/error/result'
import type { ProductDetail } from '@/features/store/domain/entities/product'
import type { ProductWrite } from '@/features/store/domain/repositories/product.repository'
import { productRepository } from '@/features/store/infrastructure/repositories/product.repository.impl'

export function createProduct(input: ProductWrite): Promise<Result<ProductDetail>> {
  return productRepository.createProduct(input)
}
