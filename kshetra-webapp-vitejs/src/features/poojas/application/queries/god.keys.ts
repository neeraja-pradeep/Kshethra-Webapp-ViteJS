import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { GodFilters } from '@/features/poojas/domain/repositories/god.repository'

/** The only place god query keys are constructed. */
export const godKeys = {
  all: QUERY_ROOTS.gods,
  /** Prefix for every list, whatever its filters — what invalidation matches on. */
  lists: () => [...godKeys.all, 'list'] as const,
  list: (filters: GodFilters) => [...godKeys.lists(), filters] as const,
}
