import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { counterKeys } from '@/features/counter-pos/application/queries/counter-pos.keys'
import { recordAgentPayment } from '@/features/counter-pos/application/usecases/recordAgentPayment'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'

interface RecordAgentPaymentVariables {
  readonly orderId: number
  readonly method: PaymentMethod
}

/** Settles an app agent-code booking at the desk. One receipt per order group. */
export function useRecordAgentPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, method }: RecordAgentPaymentVariables) => unwrap(await recordAgentPayment(orderId, method)),
    onSuccess: () => {
      // The booking moves to "collected", and agent-code receipts count toward
      // the day's takings just like walk-ins do.
      void queryClient.invalidateQueries({ queryKey: counterKeys.agentBookings() })
      void queryClient.invalidateQueries({ queryKey: counterKeys.summaries() })
    },
  })
}
