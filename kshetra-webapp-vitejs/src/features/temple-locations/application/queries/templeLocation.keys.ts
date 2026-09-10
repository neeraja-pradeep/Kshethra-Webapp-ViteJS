import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { TempleLocationFilters } from '@/features/temple-locations/domain/repositories/temple-location.repository'

/** The only place temple location query keys are constructed. */
export const templeLocationKeys = {
  all: QUERY_ROOTS.templeLocations,
  /** Prefix for every list, whatever its paging — what invalidation matches on. */
  lists: () => [...templeLocationKeys.all, 'list'] as const,
  list: (filters: TempleLocationFilters) => [...templeLocationKeys.lists(), filters] as const,
  detail: (id: number) => [...templeLocationKeys.all, 'detail', id] as const,
}
