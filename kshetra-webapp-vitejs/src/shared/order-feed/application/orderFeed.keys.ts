import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { OrderFilters } from '@/shared/order-feed/domain/order-feed.repository'

/**
 * Keys for the shared feed.
 *
 * Rooted at `QUERY_ROOTS.orders` and keyed by the filters — which include
 * `source` — so the pooja and shop lists are separate cache entries of one
 * query, and a write in either feature can invalidate both with `lists()`.
 */
export const orderFeedKeys = {
  all: QUERY_ROOTS.orders,
  lists: () => [...orderFeedKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderFeedKeys.lists(), filters] as const,
}
