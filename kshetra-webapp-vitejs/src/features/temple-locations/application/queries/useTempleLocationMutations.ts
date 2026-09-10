import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import type { TempleLocationWrite } from '@/features/temple-locations/domain/entities/temple-location'
import { createTempleLocation } from '@/features/temple-locations/application/usecases/createTempleLocation'
import { deleteTempleLocation } from '@/features/temple-locations/application/usecases/deleteTempleLocation'
import { updateTempleLocation } from '@/features/temple-locations/application/usecases/updateTempleLocation'
import { templeLocationKeys } from '@/features/temple-locations/application/queries/templeLocation.keys'

/**
 * Every write invalidates the whole list.
 *
 * Not only the edited row: activating or deleting a site changes which site
 * *every other* poojari resolves to, so a neighbouring row's meaning moves even
 * though its own fields did not.
 */
function useTempleLocationInvalidation() {
  const queryClient = useQueryClient()
  return useCallback(
    (id?: number) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: templeLocationKeys.lists() }),
        ...(id === undefined
          ? []
          : [queryClient.invalidateQueries({ queryKey: templeLocationKeys.detail(id) })]),
      ]),
    [queryClient],
  )
}

export function useCreateTempleLocationMutation() {
  const invalidate = useTempleLocationInvalidation()
  return useMutation({
    mutationFn: async (input: TempleLocationWrite) => unwrap(await createTempleLocation(input)),
    onSuccess: () => invalidate(),
  })
}

export function useUpdateTempleLocationMutation() {
  const invalidate = useTempleLocationInvalidation()
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: TempleLocationWrite }) =>
      unwrap(await updateTempleLocation(id, input)),
    onSuccess: (_result, { id }) => invalidate(id),
  })
}

export function useDeleteTempleLocationMutation() {
  const invalidate = useTempleLocationInvalidation()
  return useMutation({
    mutationFn: async (id: number) => unwrap(await deleteTempleLocation(id)),
    onSuccess: () => invalidate(),
  })
}
