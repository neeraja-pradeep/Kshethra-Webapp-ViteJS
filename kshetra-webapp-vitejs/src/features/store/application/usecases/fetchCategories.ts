import type { Result } from '@/core/error/result'
import type { Category } from '@/features/store/domain/entities/category'
import { categoryRepository } from '@/features/store/infrastructure/repositories/category.repository.impl'

export function fetchCategories(): Promise<Result<readonly Category[]>> {
  return categoryRepository.fetchCategories()
}
