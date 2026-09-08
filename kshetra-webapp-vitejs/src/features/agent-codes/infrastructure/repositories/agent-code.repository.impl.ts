import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type {
  AgentCode,
  AgentCodeDetail,
  AgentCodePage,
  AgentCodeStatus,
  AgentCodeWrite,
} from '@/features/agent-codes/domain/entities/agent-code'
import type {
  AgentCodeFilters,
  AgentCodeRepository,
} from '@/features/agent-codes/domain/repositories/agent-code.repository'
import {
  toAgentCode,
  toAgentCodeDetail,
  toAgentCodeSummary,
} from '@/features/agent-codes/infrastructure/data-sources/remote/agentCode.response'
import {
  deleteAgentCode,
  getAgentCode,
  getAgentCodes,
  patchAgentCode,
  patchAgentCodeStatus,
  postAgentCode,
} from '@/features/agent-codes/infrastructure/data-sources/remote/agentCodes.api'

export const agentCodeRepository: AgentCodeRepository = {
  async fetchAgentCodes(filters: AgentCodeFilters = {}): Promise<Result<AgentCodePage>> {
    try {
      const page = await getAgentCodes(filters)
      return ok({
        count: page.count,
        results: page.results.map(toAgentCode),
        summary: toAgentCodeSummary(page.summary),
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchAgentCode(id: number): Promise<Result<AgentCodeDetail>> {
    try {
      return ok(toAgentCodeDetail(await getAgentCode(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createAgentCode(input: AgentCodeWrite): Promise<Result<AgentCodeDetail>> {
    try {
      return ok(toAgentCodeDetail(await postAgentCode(input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async updateAgentCode(id: number, input: AgentCodeWrite): Promise<Result<AgentCodeDetail>> {
    try {
      return ok(toAgentCodeDetail(await patchAgentCode(id, input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setAgentCodeStatus(id: number, status: AgentCodeStatus): Promise<Result<AgentCode>> {
    try {
      return ok(toAgentCode(await patchAgentCodeStatus(id, status)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async deleteAgentCode(id: number): Promise<Result<void>> {
    try {
      await deleteAgentCode(id)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
