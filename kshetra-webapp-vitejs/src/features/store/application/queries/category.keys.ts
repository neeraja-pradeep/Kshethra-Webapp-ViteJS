import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

/**
 * The only place category query keys are constructed.
 *
 * One list key, because there is only ever one list: the feed is unfiltered and
 * unpaged so the screen can drag against the whole of it.
 */
export const categoryKeys = {
  all: QUERY_ROOTS.storeCategories,
  list: () => [...categoryKeys.all, 'list'] as const,
}
