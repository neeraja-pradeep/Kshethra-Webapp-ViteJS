import type { Result } from '@/core/error/result'
import type { AgentCodePage } from '@/features/agent-codes/domain/entities/agent-code'
import type { AgentCodeFilters } from '@/features/agent-codes/domain/repositories/agent-code.repository'
import { agentCodeRepository } from '@/features/agent-codes/infrastructure/repositories/agent-code.repository.impl'

export function fetchAgentCodes(filters?: AgentCodeFilters): Promise<Result<AgentCodePage>> {
  return agentCodeRepository.fetchAgentCodes(filters)
}
