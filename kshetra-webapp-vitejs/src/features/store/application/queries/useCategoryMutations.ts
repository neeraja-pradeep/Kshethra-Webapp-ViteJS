import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'
import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import { categoryKeys } from '@/features/store/application/queries/category.keys'
import { createCategory } from '@/features/store/application/usecases/createCategory'
import { deleteCategory } from '@/features/store/application/usecases/deleteCategory'
import { reorderCategories } from '@/features/store/application/usecases/reorderCategories'
import { setCategoryStatus } from '@/features/store/application/usecases/setCategoryStatus'
import { updateCategory } from '@/features/store/application/usecases/updateCategory'
import type { Category, CategoryStatus } from '@/features/store/domain/entities/category'
import type { CategoryWrite } from '@/features/store/domain/repositories/category.repository'

/** Writes land in the list cache, which is the only place a category is held. */
function useCategoryInvalidation() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: categoryKeys.all })
}

export function useCreateCategoryMutation() {
  const invalidate = useCategoryInvalidation()
  return useMutation({
    mutationFn: async (input: CategoryWrite) => unwrap(await createCategory(input)),
    onSuccess: invalidate,
  })
}

export function useUpdateCategoryMutation() {
  const invalidate = useCategoryInvalidation()
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: Partial<CategoryWrite> }) =>
      unwrap(await updateCategory(id, input)),
    onSuccess: invalidate,
  })
}

export function useSetCategoryStatusMutation() {
  const invalidate = useCategoryInvalidation()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: CategoryStatus }) =>
      unwrap(await setCategoryStatus(id, status)),
    onSuccess: invalidate,
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => unwrap(await deleteCategory(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      // A category whose products have no variants takes them with it, so the
      // catalogue can be shorter than it was a moment ago.
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.storeProducts })
    },
  })
}

/**
 * Reordering, applied optimistically.
 *
 * This is the one write here worth being optimistic about: a drag that snapped
 * back while a request flew would read as the drop having failed. The rollback
 * is what makes that safe — and the server's own `1..N` numbering replaces the
 * guess as soon as it answers, so the optimistic order is never what persists.
 */
export function useReorderCategoriesMutation() {
  const queryClient = useQueryClient()
  const key = categoryKeys.list()

  return useMutation({
    mutationFn: async (orderedIds: readonly number[]) => unwrap(await reorderCategories(orderedIds)),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<readonly Category[]>(key)
      if (previous) {
        const byId = new Map(previous.map((category) => [category.id, category]))
        const next = orderedIds.map((id) => byId.get(id)).filter((c): c is Category => c != null)
        queryClient.setQueryData(key, next)
      }
      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: (categories) => queryClient.setQueryData(key, categories),
  })
}
