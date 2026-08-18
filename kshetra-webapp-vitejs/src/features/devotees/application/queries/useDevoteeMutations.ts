import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { devoteeKeys } from '@/features/devotees/application/queries/devotee.keys'
import { setDevoteeStatus } from '@/features/devotees/application/usecases/setDevoteeStatus'
import type { DevoteeStatus } from '@/features/devotees/domain/entities/devotee'

/**
 * Suspending or reinstating moves both the row and the tiles above it, and the
 * open detail carries the same status — so the whole root is invalidated rather
 * than the row patched in place.
 */
export function useDevoteeStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: DevoteeStatus }) =>
      unwrap(await setDevoteeStatus(id, status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: devoteeKeys.all }),
  })
}
