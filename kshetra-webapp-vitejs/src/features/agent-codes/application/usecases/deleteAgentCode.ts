import type { Result } from '@/core/error/result'
import { agentCodeRepository } from '@/features/agent-codes/infrastructure/repositories/agent-code.repository.impl'

export function deleteAgentCode(id: number): Promise<Result<void>> {
  return agentCodeRepository.deleteAgentCode(id)
}
