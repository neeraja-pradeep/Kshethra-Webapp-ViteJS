import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'
import { fetchOrderFeed } from '@/shared/order-feed/application/fetchOrderFeed'
import { orderFeedKeys } from '@/shared/order-feed/application/orderFeed.keys'
import type { OrderFilters } from '@/shared/order-feed/domain/order-feed.repository'

/**
 * One page of the order feed, tiles included. Used by both order screens —
 * they differ only in the `source` they pin.
 *
 * `keepPreviousData` is what stops the table blanking on every keystroke, page
 * turn and filter change.
 */
export function useOrderFeedQuery(filters: OrderFilters) {
  return useQuery({
    queryKey: orderFeedKeys.list(filters),
    queryFn: async () => unwrap(await fetchOrderFeed(filters)),
    placeholderData: keepPreviousData,
  })
}
