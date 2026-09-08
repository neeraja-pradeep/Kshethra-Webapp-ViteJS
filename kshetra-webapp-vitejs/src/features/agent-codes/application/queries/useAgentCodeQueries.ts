import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { agentCodeKeys } from '@/features/agent-codes/application/queries/agentCode.keys'
import { fetchAgentCode } from '@/features/agent-codes/application/usecases/fetchAgentCode'
import { fetchAgentCodes } from '@/features/agent-codes/application/usecases/fetchAgentCodes'
import type { AgentCodeFilters } from '@/features/agent-codes/domain/repositories/agent-code.repository'

/**
 * One page of the table, and the tiles above it.
 *
 * `keepPreviousData` is what stops the table blanking on every keystroke, page
 * turn and filter change: the previous page stays on screen, dimmed by the
 * caller, until the new one lands.
 */
export function useAgentCodesQuery(filters: AgentCodeFilters) {
  return useQuery({
    queryKey: agentCodeKeys.list(filters),
    queryFn: async () => unwrap(await fetchAgentCodes(filters)),
    placeholderData: keepPreviousData,
  })
}

/**
 * The drill-down behind one row — the usage card and the delete guard. Only
 * fetched while the detail is open; the list row carries none of it.
 */
export function useAgentCodeQuery(id: number | null) {
  return useQuery({
    queryKey: agentCodeKeys.detail(id ?? 0),
    queryFn: async () => unwrap(await fetchAgentCode(id as number)),
    enabled: id !== null,
  })
}
