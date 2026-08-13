import type { Result } from '@/core/error/result'
import type { ProductFilters, ProductPage } from '@/features/store/domain/repositories/product.repository'
import { productRepository } from '@/features/store/infrastructure/repositories/product.repository.impl'

export function fetchProducts(filters?: ProductFilters): Promise<Result<ProductPage>> {
  return productRepository.fetchProducts(filters)
}
