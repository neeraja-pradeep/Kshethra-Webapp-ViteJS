import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { PoojaFilters } from '@/features/poojas/domain/repositories/pooja.repository'

/** The only place pooja query keys are constructed. */
export const poojaKeys = {
  all: QUERY_ROOTS.poojas,
  /** Prefix for every list, whatever its filters — what invalidation matches on. */
  lists: () => [...poojaKeys.all, 'list'] as const,
  list: (filters: PoojaFilters) => [...poojaKeys.lists(), filters] as const,
  detail: (poojaId: number) => [...poojaKeys.all, 'detail', poojaId] as const,
  availability: (poojaId: number, start: string, end: string) =>
    [...poojaKeys.all, 'availability', poojaId, start, end] as const,
}
