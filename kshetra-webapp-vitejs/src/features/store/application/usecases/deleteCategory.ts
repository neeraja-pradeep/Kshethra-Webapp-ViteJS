import type { Result } from '@/core/error/result'
import { categoryRepository } from '@/features/store/infrastructure/repositories/category.repository.impl'

export function deleteCategory(id: number): Promise<Result<void>> {
  return categoryRepository.deleteCategory(id)
}
