import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

/**
 * Shop-order keys sit under their own root, **not** under the feed's.
 *
 * An order id is a primary key within its own table, so `['orders','detail',5]`
 * would be claimed by both a pooja order and a shop order — and whichever
 * loaded second would render the other's payload.
 */
export const storeOrderKeys = {
  all: QUERY_ROOTS.storeOrders,
  detail: (orderId: number) => [...storeOrderKeys.all, 'detail', orderId] as const,
  receipt: (orderId: number) => [...storeOrderKeys.all, 'receipt', orderId] as const,
}
