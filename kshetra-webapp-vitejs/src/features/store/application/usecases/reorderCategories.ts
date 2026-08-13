import type { Result } from '@/core/error/result'
import type { Category } from '@/features/store/domain/entities/category'
import { categoryRepository } from '@/features/store/infrastructure/repositories/category.repository.impl'

/** Every id, in the order they should appear — a partial order is refused. */
export function reorderCategories(orderedIds: readonly number[]): Promise<Result<readonly Category[]>> {
  return categoryRepository.reorderCategories(orderedIds)
}
