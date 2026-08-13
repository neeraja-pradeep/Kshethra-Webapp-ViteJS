import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { OrderFilters } from '@/shared/order-feed/domain/order-feed.repository'

/** The only place orders query keys are constructed. */
export const orderKeys = {
  all: QUERY_ROOTS.orders,
  /** Prefix for every list, whatever its filters — what invalidation matches on. */
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  detail: (orderId: number) => [...orderKeys.all, 'detail', orderId] as const,
  receipt: (orderId: number) => [...orderKeys.all, 'receipt', orderId] as const,
  poojaris: () => [...orderKeys.all, 'poojaris'] as const,
}
