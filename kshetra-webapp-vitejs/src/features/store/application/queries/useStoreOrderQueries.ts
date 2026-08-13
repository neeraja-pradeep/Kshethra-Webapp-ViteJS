import { useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { storeOrderKeys } from '@/features/store/application/queries/storeOrder.keys'
import { fetchStoreOrder } from '@/features/store/application/usecases/fetchStoreOrder'
import { fetchStoreOrderReceipt } from '@/features/store/application/usecases/fetchStoreOrderReceipt'

/** One shop order in full. Skipped until a row is opened. */
export function useStoreOrderQuery(orderId: number | null) {
  return useQuery({
    queryKey: storeOrderKeys.detail(orderId ?? 0),
    queryFn: async () => unwrap(await fetchStoreOrder(orderId as number)),
    enabled: orderId != null,
  })
}

/** Fetched only once the receipt is asked for — it is a second round trip. */
export function useStoreOrderReceiptQuery(orderId: number | null) {
  return useQuery({
    queryKey: storeOrderKeys.receipt(orderId ?? 0),
    queryFn: async () => unwrap(await fetchStoreOrderReceipt(orderId as number)),
    enabled: orderId != null,
  })
}
