import type { Result } from '@/core/error/result'
import type { AgentCodeDetail } from '@/features/agent-codes/domain/entities/agent-code'
import { agentCodeRepository } from '@/features/agent-codes/infrastructure/repositories/agent-code.repository.impl'

export function fetchAgentCode(id: number): Promise<Result<AgentCodeDetail>> {
  return agentCodeRepository.fetchAgentCode(id)
}
