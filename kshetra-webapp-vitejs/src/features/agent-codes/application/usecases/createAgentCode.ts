import type { Result } from '@/core/error/result'
import type { AgentCodeDetail, AgentCodeWrite } from '@/features/agent-codes/domain/entities/agent-code'
import { agentCodeRepository } from '@/features/agent-codes/infrastructure/repositories/agent-code.repository.impl'

export function createAgentCode(input: AgentCodeWrite): Promise<Result<AgentCodeDetail>> {
  return agentCodeRepository.createAgentCode(input)
}
