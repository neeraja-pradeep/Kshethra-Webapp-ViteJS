import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'
import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import { godKeys } from '@/features/poojas/application/queries/god.keys'
import { poojaKeys } from '@/features/poojas/application/queries/pooja.keys'
import { bulkDeletePoojas } from '@/features/poojas/application/usecases/bulkDeletePoojas'
import { bulkSetPoojaStatus } from '@/features/poojas/application/usecases/bulkSetPoojaStatus'
import { createPooja } from '@/features/poojas/application/usecases/createPooja'
import { deletePooja } from '@/features/poojas/application/usecases/deletePooja'
import { duplicatePooja } from '@/features/poojas/application/usecases/duplicatePooja'
import { importPoojas } from '@/features/poojas/application/usecases/importPoojas'
import { setPoojaStatus } from '@/features/poojas/application/usecases/setPoojaStatus'
import { updatePooja } from '@/features/poojas/application/usecases/updatePooja'
import type { PoojaStatus } from '@/features/poojas/domain/entities/pooja'
import type { PoojaWrite } from '@/features/poojas/domain/repositories/pooja.repository'

/**
 * Lists are invalidated, never patched.
 *
 * The summary tiles are counted server-side over the whole filtered catalogue,
 * and a rename, a price change or a status flip can change which page a row
 * belongs on — or whether it belongs in the current result at all. Neither is
 * something a client-side splice could reproduce honestly.
 *
 * The detail key is invalidated rather than seeded from the write response,
 * because a write does not necessarily echo back every derived field the read
 * carries. Refetching costs one request; a half-populated cache entry costs a
 * bug that only shows up on the second open.
 *
 * Gods are invalidated too: `poojas_count` moved. So is the counter, which
 * holds its own copy of the catalogue for five minutes at a time.
 */
function usePoojaInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    // The whole root, not just `lists()`: the drawer's booking calendar lives
    // under `availability` and a saved block has to reach it, or the panel
    // keeps showing the calendar as it was before the save.
    void queryClient.invalidateQueries({ queryKey: poojaKeys.all })
    void queryClient.invalidateQueries({ queryKey: godKeys.all })
    void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.counter })
  }
}

export function useCreatePoojaMutation() {
  const invalidate = usePoojaInvalidation()
  return useMutation({
    mutationFn: async (input: PoojaWrite) => unwrap(await createPooja(input)),
    onSuccess: () => invalidate(),
  })
}

export function useUpdatePoojaMutation() {
  const invalidate = usePoojaInvalidation()
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: Partial<PoojaWrite> }) =>
      unwrap(await updatePooja(id, input)),
    onSuccess: () => invalidate(),
  })
}

export function useSetPoojaStatusMutation() {
  const invalidate = usePoojaInvalidation()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: PoojaStatus }) =>
      unwrap(await setPoojaStatus(id, status)),
    onSuccess: () => invalidate(),
  })
}

export function useDeletePoojaMutation() {
  const invalidate = usePoojaInvalidation()
  return useMutation({
    mutationFn: async (id: number) => unwrap(await deletePooja(id)),
    onSuccess: () => invalidate(),
  })
}

/** Writes a new pooja and never touches the original, so it asks for `add_pooja`. */
export function useDuplicatePoojaMutation() {
  const invalidate = usePoojaInvalidation()
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name?: string }) =>
      unwrap(await duplicatePooja(id, name)),
    onSuccess: () => invalidate(),
  })
}

export function useBulkPoojaStatusMutation() {
  const invalidate = usePoojaInvalidation()
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: readonly number[]; status: PoojaStatus }) =>
      unwrap(await bulkSetPoojaStatus(ids, status)),
    onSuccess: () => invalidate(),
  })
}

export function useBulkDeletePoojasMutation() {
  const invalidate = usePoojaInvalidation()
  return useMutation({
    mutationFn: async (ids: readonly number[]) => unwrap(await bulkDeletePoojas(ids)),
    onSuccess: () => invalidate(),
  })
}

export function useImportPoojasMutation() {
  const invalidate = usePoojaInvalidation()
  return useMutation({
    mutationFn: async (file: File) => unwrap(await importPoojas(file)),
    onSuccess: () => invalidate(),
  })
}
