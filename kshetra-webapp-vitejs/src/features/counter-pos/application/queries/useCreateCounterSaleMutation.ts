import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { counterKeys } from '@/features/counter-pos/application/queries/counter-pos.keys'
import { createCounterSale } from '@/features/counter-pos/application/usecases/createCounterSale'
import type { CreateSaleInput } from '@/features/counter-pos/domain/entities/counter-sale'

/**
 * Takes a walk-in sale. The resolved receipt is the server's — its number,
 * total and staff name are what the printed receipt must show.
 */
export function useCreateCounterSaleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSaleInput) => unwrap(await createCounterSale(input)),
    onSuccess: () => {
      // The day's takings just changed.
      void queryClient.invalidateQueries({ queryKey: counterKeys.summaries() })
    },
  })
}
