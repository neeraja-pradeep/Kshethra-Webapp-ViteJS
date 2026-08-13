import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'
import { orderFeedKeys } from '@/shared/order-feed/application/orderFeed.keys'

import { storeOrderKeys } from '@/features/store/application/queries/storeOrder.keys'
import { productKeys } from '@/features/store/application/queries/product.keys'
import { cancelStoreOrder } from '@/features/store/application/usecases/cancelStoreOrder'
import { createWalkInSale } from '@/features/store/application/usecases/createWalkInSale'
import { refundStoreOrder } from '@/features/store/application/usecases/refundStoreOrder'
import { setFulfilmentStatus } from '@/features/store/application/usecases/setFulfilmentStatus'
import type { FulfilmentStatus, StoreOrderDetail } from '@/features/store/domain/entities/store-order'
import type { WalkInSale } from '@/features/store/domain/repositories/storeOrder.repository'

/**
 * Every write here answers with the whole order, so the detail cache is written
 * from the response rather than refetched.
 *
 * The **feed** is invalidated because its tiles are counted server-side over
 * the filtered set — no client patch reproduces them. **Products** are
 * invalidated too whenever stock can move: a cancellation restocks unshipped
 * goods, and a walk-in takes them off the shelf.
 */
function useStoreOrderWriteSuccess(alsoStock = false) {
  const queryClient = useQueryClient()
  return (detail: StoreOrderDetail) => {
    queryClient.setQueryData(storeOrderKeys.detail(detail.id), detail)
    void queryClient.invalidateQueries({ queryKey: storeOrderKeys.receipt(detail.id) })
    void queryClient.invalidateQueries({ queryKey: orderFeedKeys.lists() })
    if (alsoStock) void queryClient.invalidateQueries({ queryKey: productKeys.all })
  }
}

export function useSetFulfilmentMutation() {
  const onWritten = useStoreOrderWriteSuccess()
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: FulfilmentStatus }) =>
      unwrap(await setFulfilmentStatus(orderId, status)),
    onSuccess: onWritten,
  })
}

export function useCancelStoreOrderMutation() {
  const onWritten = useStoreOrderWriteSuccess(true)
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason: string }) =>
      unwrap(await cancelStoreOrder(orderId, reason)),
    onSuccess: onWritten,
  })
}

export function useRefundStoreOrderMutation() {
  const onWritten = useStoreOrderWriteSuccess()
  return useMutation({
    mutationFn: async ({ orderId, reason, amount }: { orderId: number; reason: string; amount?: number }) =>
      unwrap(await refundStoreOrder(orderId, reason, amount)),
    onSuccess: onWritten,
  })
}

export function useCreateWalkInSaleMutation() {
  const onWritten = useStoreOrderWriteSuccess(true)
  return useMutation({
    mutationFn: async (sale: WalkInSale) => unwrap(await createWalkInSale(sale)),
    onSuccess: onWritten,
  })
}
