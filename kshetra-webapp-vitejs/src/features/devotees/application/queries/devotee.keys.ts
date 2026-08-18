import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { DevoteeFilters } from '@/features/devotees/domain/repositories/devotee.repository'

/** The only place devotee query keys are constructed. */
export const devoteeKeys = {
  all: QUERY_ROOTS.devotees,
  list: (filters: DevoteeFilters) => [...devoteeKeys.all, 'list', filters] as const,
  detail: (id: number) => [...devoteeKeys.all, 'detail', id] as const,
}
