import type { Result } from '@/core/error/result'
import type { AgentCode, AgentCodeStatus } from '@/features/agent-codes/domain/entities/agent-code'
import { agentCodeRepository } from '@/features/agent-codes/infrastructure/repositories/agent-code.repository.impl'

export function setAgentCodeStatus(id: number, status: AgentCodeStatus): Promise<Result<AgentCode>> {
  return agentCodeRepository.setAgentCodeStatus(id, status)
}
