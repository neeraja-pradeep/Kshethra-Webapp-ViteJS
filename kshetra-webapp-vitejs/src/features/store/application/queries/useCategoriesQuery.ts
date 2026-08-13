import { useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { categoryKeys } from '@/features/store/application/queries/category.keys'
import { fetchCategories } from '@/features/store/application/usecases/fetchCategories'

/**
 * The whole category list, in `sortOrder`.
 *
 * No `keepPreviousData`: there is nothing to page or filter, so there is never
 * a previous page to hold. Shared by the categories screen, the products
 * filter dropdown and the product form — one cache entry serves all three.
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => unwrap(await fetchCategories()),
  })
}
