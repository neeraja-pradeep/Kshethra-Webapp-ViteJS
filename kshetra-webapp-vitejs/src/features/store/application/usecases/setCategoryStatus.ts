import type { Result } from '@/core/error/result'
import type { Category, CategoryStatus } from '@/features/store/domain/entities/category'
import { categoryRepository } from '@/features/store/infrastructure/repositories/category.repository.impl'

export function setCategoryStatus(id: number, status: CategoryStatus): Promise<Result<Category>> {
  return categoryRepository.setCategoryStatus(id, status)
}
