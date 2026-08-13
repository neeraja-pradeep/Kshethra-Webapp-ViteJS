import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { ProductFilters } from '@/features/store/domain/repositories/product.repository'

/** The only place product query keys are constructed. */
export const productKeys = {
  all: QUERY_ROOTS.storeProducts,
  /** Prefix for every list, whatever its filters — what invalidation matches on. */
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  detail: (productId: number) => [...productKeys.all, 'detail', productId] as const,
  stockHistory: (productId: number) => [...productKeys.all, 'stock', productId] as const,
}
