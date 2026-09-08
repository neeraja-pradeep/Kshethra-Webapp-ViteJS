import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { AgentCodeFilters } from '@/features/agent-codes/domain/repositories/agent-code.repository'

/** The only place agent code query keys are constructed. */
export const agentCodeKeys = {
  all: QUERY_ROOTS.agentCodes,
  /** Prefix for every list, whatever its filters — what invalidation matches on. */
  lists: () => [...agentCodeKeys.all, 'list'] as const,
  list: (filters: AgentCodeFilters) => [...agentCodeKeys.lists(), filters] as const,
  detail: (id: number) => [...agentCodeKeys.all, 'detail', id] as const,
}
