import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { agentCodeKeys } from '@/features/agent-codes/application/queries/agentCode.keys'
import { createAgentCode } from '@/features/agent-codes/application/usecases/createAgentCode'
import { deleteAgentCode } from '@/features/agent-codes/application/usecases/deleteAgentCode'
import { setAgentCodeStatus } from '@/features/agent-codes/application/usecases/setAgentCodeStatus'
import { updateAgentCode } from '@/features/agent-codes/application/usecases/updateAgentCode'
import type { AgentCodeStatus, AgentCodeWrite } from '@/features/agent-codes/domain/entities/agent-code'

/**
 * Every write invalidates the lists, because all of them move a tile: the
 * summary counts `active` and `inactive`, and the status toggle's own response
 * deliberately carries no summary to splice back in.
 */
function useAgentCodeInvalidation() {
  const queryClient = useQueryClient()
  return useCallback(
    (id?: number) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: agentCodeKeys.lists() }),
        ...(id === undefined ? [] : [queryClient.invalidateQueries({ queryKey: agentCodeKeys.detail(id) })]),
      ]),
    [queryClient],
  )
}

export function useCreateAgentCodeMutation() {
  const invalidate = useAgentCodeInvalidation()
  return useMutation({
    mutationFn: async (input: AgentCodeWrite) => unwrap(await createAgentCode(input)),
    onSuccess: () => invalidate(),
  })
}

export function useUpdateAgentCodeMutation() {
  const invalidate = useAgentCodeInvalidation()
  return useMutation({
    /** A cleared field must be sent as an explicit `null` — absent leaves it alone. */
    mutationFn: async ({ id, input }: { id: number; input: AgentCodeWrite }) =>
      unwrap(await updateAgentCode(id, input)),
    onSuccess: (_result, { id }) => invalidate(id),
  })
}

export function useAgentCodeStatusMutation() {
  const invalidate = useAgentCodeInvalidation()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: AgentCodeStatus }) =>
      unwrap(await setAgentCodeStatus(id, status)),
    onSuccess: (_result, { id }) => invalidate(id),
  })
}

export function useDeleteAgentCodeMutation() {
  const invalidate = useAgentCodeInvalidation()
  return useMutation({
    mutationFn: async (id: number) => unwrap(await deleteAgentCode(id)),
    onSuccess: () => invalidate(),
  })
}
