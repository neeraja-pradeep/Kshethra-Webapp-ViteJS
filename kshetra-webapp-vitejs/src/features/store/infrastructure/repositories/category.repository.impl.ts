import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { Category, CategoryStatus } from '@/features/store/domain/entities/category'
import type { CategoryRepository, CategoryWrite } from '@/features/store/domain/repositories/category.repository'
import {
  deleteCategoryRequest,
  getCategories,
  patchCategory,
  patchCategoryStatus,
  postCategory,
  postReorderCategories,
} from '@/features/store/infrastructure/data-sources/remote/categories.api'
import { toCategory } from '@/features/store/infrastructure/data-sources/remote/category.response'

export const categoryRepository: CategoryRepository = {
  async fetchCategories(): Promise<Result<readonly Category[]>> {
    try {
      return ok((await getCategories()).map(toCategory))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createCategory(input: CategoryWrite): Promise<Result<Category>> {
    try {
      return ok(toCategory(await postCategory(input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async updateCategory(id: number, input: Partial<CategoryWrite>): Promise<Result<Category>> {
    try {
      return ok(toCategory(await patchCategory(id, input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async deleteCategory(id: number): Promise<Result<void>> {
    try {
      await deleteCategoryRequest(id)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setCategoryStatus(id: number, status: CategoryStatus): Promise<Result<Category>> {
    try {
      return ok(toCategory(await patchCategoryStatus(id, status)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async reorderCategories(orderedIds: readonly number[]): Promise<Result<readonly Category[]>> {
    try {
      // The server's own `1..N` numbering comes back on the response, so the
      // caller redraws from what was actually written rather than from the
      // order it hoped for.
      return ok((await postReorderCategories(orderedIds)).map(toCategory))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
