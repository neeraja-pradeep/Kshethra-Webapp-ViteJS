import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { MediaFilters } from '@/features/media/domain/repositories/media.repository'

/** The only place media query keys are constructed. */
export const mediaKeys = {
  all: QUERY_ROOTS.media,
  /** Prefix for every list, whatever its filters — what invalidation matches on. */
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (filters: MediaFilters) => [...mediaKeys.lists(), filters] as const,
  detail: (id: number) => [...mediaKeys.all, 'detail', id] as const,
}
