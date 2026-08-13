import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { orderKeys } from '@/features/orders/application/queries/order.keys'
import { fetchOrderPoojaris } from '@/features/orders/application/usecases/fetchOrderPoojaris'
import { fetchOrders } from '@/features/orders/application/usecases/fetchOrders'
import { fetchPoojaOrder } from '@/features/orders/application/usecases/fetchPoojaOrder'
import { fetchPoojaOrderReceipt } from '@/features/orders/application/usecases/fetchPoojaOrderReceipt'
import type { OrderFilters } from '@/shared/order-feed/domain/order-feed.repository'

/** The poojari roster changes when an admin edits it, not minute to minute. */
const ROSTER_STALE_TIME_MS = 10 * 60 * 1000

/**
 * One page of the feed, tiles included.
 *
 * `keepPreviousData` is what stops the table blanking on every keystroke, page
 * turn and filter change: the previous page stays on screen, dimmed by the
 * caller, until the new one lands.
 */
export function useOrdersQuery(filters: OrderFilters) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async () => unwrap(await fetchOrders(filters)),
    placeholderData: keepPreviousData,
  })
}

/** One order in full. Skipped until a row is actually opened. */
export function useOrderDetailQuery(orderId: number | null) {
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? 0),
    queryFn: async () => unwrap(await fetchPoojaOrder(orderId as number)),
    enabled: orderId != null,
  })
}

/** Fetched only once the receipt is asked for — it is a second round trip. */
export function useOrderReceiptQuery(orderId: number | null) {
  return useQuery({
    queryKey: orderKeys.receipt(orderId ?? 0),
    queryFn: async () => unwrap(await fetchPoojaOrderReceipt(orderId as number)),
    enabled: orderId != null,
  })
}

export function useOrderPoojarisQuery(enabled = true) {
  return useQuery({
    queryKey: orderKeys.poojaris(),
    queryFn: async () => unwrap(await fetchOrderPoojaris()),
    staleTime: ROSTER_STALE_TIME_MS,
    enabled,
  })
}
