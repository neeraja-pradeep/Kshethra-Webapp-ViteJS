import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'
import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import { godKeys } from '@/features/poojas/application/queries/god.keys'
import { createGod } from '@/features/poojas/application/usecases/createGod'
import { deleteGod } from '@/features/poojas/application/usecases/deleteGod'
import { reorderGods } from '@/features/poojas/application/usecases/reorderGods'
import { setGodStatus } from '@/features/poojas/application/usecases/setGodStatus'
import { updateGod } from '@/features/poojas/application/usecases/updateGod'
import type { God, GodStatus } from '@/features/poojas/domain/entities/god'
import type { GodWrite } from '@/features/poojas/domain/repositories/god.repository'

/**
 * Lists are invalidated, never patched.
 *
 * The summary tiles are counted server-side over the filters, and a rename or
 * a status flip can change whether a row belongs in the current result at all —
 * neither is something a client-side patch could reproduce honestly.
 *
 * The counter holds its own copy of the god list for five minutes, so a rename
 * here has to reach the till too.
 */
function useGodInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: godKeys.all })
    void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.counter })
  }
}

export function useCreateGodMutation() {
  const invalidate = useGodInvalidation()
  return useMutation({
    mutationFn: async (input: GodWrite) => unwrap(await createGod(input)),
    onSuccess: invalidate,
  })
}

export function useUpdateGodMutation() {
  const invalidate = useGodInvalidation()
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: Partial<GodWrite> }) =>
      unwrap(await updateGod(id, input)),
    onSuccess: invalidate,
  })
}

export function useSetGodStatusMutation() {
  const invalidate = useGodInvalidation()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: GodStatus }) =>
      unwrap(await setGodStatus(id, status)),
    onSuccess: invalidate,
  })
}

export function useDeleteGodMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => unwrap(await deleteGod(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: godKeys.all })
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.counter })
      // Only a god nothing references can be deleted, so no pooja changed —
      // but the pooja screen's god filter just lost an option.
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.poojas })
    },
  })
}

/**
 * Reordering, applied optimistically.
 *
 * This is the one write here worth being optimistic about: a row that snapped
 * back while the request flew would read as the drop having failed. The
 * rollback is what makes that safe — and the server's own `1..N` numbering
 * replaces the guess as soon as it answers, so the optimistic order is never
 * what persists.
 */
export function useReorderGodsMutation(listKey: readonly unknown[]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderedIds: readonly number[]) => unwrap(await reorderGods(orderedIds)),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<{ results: readonly God[] }>(listKey)
      if (previous) {
        const byId = new Map(previous.results.map((god) => [god.id, god]))
        const next = orderedIds.map((id) => byId.get(id)).filter((god): god is God => god != null)
        queryClient.setQueryData(listKey, { ...previous, results: next })
      }
      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous)
    },
    onSuccess: () => {
      // The response carries the server's numbering, but `poojas_count` and the
      // summary ride on the list payload too — refetch rather than splice.
      void queryClient.invalidateQueries({ queryKey: godKeys.all })
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.counter })
    },
  })
}
