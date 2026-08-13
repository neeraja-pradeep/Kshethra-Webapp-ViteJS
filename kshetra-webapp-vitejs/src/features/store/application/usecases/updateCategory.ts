import type { Result } from '@/core/error/result'
import type { Category } from '@/features/store/domain/entities/category'
import type { CategoryWrite } from '@/features/store/domain/repositories/category.repository'
import { categoryRepository } from '@/features/store/infrastructure/repositories/category.repository.impl'

export function updateCategory(id: number, input: Partial<CategoryWrite>): Promise<Result<Category>> {
  return categoryRepository.updateCategory(id, input)
}
