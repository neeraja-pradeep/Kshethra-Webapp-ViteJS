import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'
import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import { orderKeys } from '@/features/orders/application/queries/order.keys'
import { assignOrderPoojari } from '@/features/orders/application/usecases/assignOrderPoojari'
import { cancelPoojaOrder } from '@/features/orders/application/usecases/cancelPoojaOrder'
import { cancelPoojaOrderBookings } from '@/features/orders/application/usecases/cancelPoojaOrderBookings'
import { completeOrderBookings } from '@/features/orders/application/usecases/completeOrderBookings'
import type { OrderDetail } from '@/features/orders/domain/entities/pooja-order-detail'

/**
 * Every write on this page answers with the whole order, so the detail cache is
 * written straight from the response rather than refetched.
 *
 * The list and its tiles still have to be invalidated — revenue, refunds and
 * the status counts are all counted server-side over the filtered set, so a
 * cancellation moves numbers no client-side patch could reproduce.
 *
 * The **bookings** feed is invalidated too. Cancelling or completing here is a
 * booking-level change, and with a 60s `staleTime` and no refetch on focus the
 * other screen would otherwise sit on stale rows.
 */
function useOrderWriteSuccess() {
  const queryClient = useQueryClient()
  return (detail: OrderDetail) => {
    queryClient.setQueryData(orderKeys.detail(detail.id), detail)
    // The receipt restates the order's refund and reconciled figures.
    void queryClient.invalidateQueries({ queryKey: orderKeys.receipt(detail.id) })
    void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.bookings })
  }
}

export function useCancelOrderMutation() {
  const onWritten = useOrderWriteSuccess()
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason: string }) =>
      unwrap(await cancelPoojaOrder(orderId, reason)),
    onSuccess: onWritten,
  })
}

export function useCancelOrderBookingsMutation() {
  const onWritten = useOrderWriteSuccess()
  return useMutation({
    mutationFn: async ({
      orderId,
      orderLineIds,
      reason,
    }: {
      orderId: number
      orderLineIds: readonly number[]
      reason?: string
    }) => unwrap(await cancelPoojaOrderBookings(orderId, orderLineIds, reason)),
    onSuccess: onWritten,
  })
}

export function useCompleteOrderBookingsMutation() {
  const onWritten = useOrderWriteSuccess()
  return useMutation({
    mutationFn: async ({ orderId, orderLineIds }: { orderId: number; orderLineIds: readonly number[] }) =>
      unwrap(await completeOrderBookings(orderId, orderLineIds)),
    onSuccess: onWritten,
  })
}

export function useAssignOrderPoojariMutation() {
  const onWritten = useOrderWriteSuccess()
  return useMutation({
    mutationFn: async ({
      orderId,
      orderLineIds,
      poojariId,
    }: {
      orderId: number
      orderLineIds: readonly number[]
      poojariId: number
    }) => unwrap(await assignOrderPoojari(orderId, orderLineIds, poojariId)),
    onSuccess: onWritten,
  })
}
