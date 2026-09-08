import { http } from '@/core/api/http'
import { AGENT_CODE_ENDPOINTS } from '@/core/config/endpoints'

import type { AgentCodeStatus, AgentCodeWrite } from '@/features/agent-codes/domain/entities/agent-code'
import type { AgentCodeFilters } from '@/features/agent-codes/domain/repositories/agent-code.repository'
import {
  agentCodeDetailSchema,
  agentCodePageSchema,
  agentCodeRowSchema,
  type AgentCodeDetailDto,
  type AgentCodePageDto,
  type AgentCodeRowDto,
} from '@/features/agent-codes/infrastructure/data-sources/remote/agentCode.response'

/** Only keys the caller actually set are sent — an empty one means "no filter". */
function toParams(filters: AgentCodeFilters): Record<string, string | number> {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.validity ? { validity: filters.validity } : {}),
    ...(filters.ordering ? { ordering: filters.ordering } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.pageSize ? { page_size: filters.pageSize } : {}),
  }
}

/**
 * The form's fields, in the server's shape.
 *
 * Only keys the caller set are sent, because on a PATCH **`null` clears and
 * absent leaves alone** — so a cleared date must arrive as an explicit null,
 * and an untouched one must not arrive at all.
 */
function toWriteBody(input: AgentCodeWrite): Record<string, unknown> {
  return {
    ...(input.code !== undefined ? { code: input.code } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.validFrom !== undefined ? { valid_from: input.validFrom } : {}),
    ...(input.validTo !== undefined ? { valid_to: input.validTo } : {}),
    ...(input.usageLimit !== undefined ? { usage_limit: input.usageLimit } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  }
}

export async function getAgentCodes(filters: AgentCodeFilters = {}): Promise<AgentCodePageDto> {
  const response = await http.get(AGENT_CODE_ENDPOINTS.codes, { params: toParams(filters) })
  return agentCodePageSchema.parse(response.data)
}

export async function getAgentCode(id: number): Promise<AgentCodeDetailDto> {
  const response = await http.get(AGENT_CODE_ENDPOINTS.code(id))
  return agentCodeDetailSchema.parse(response.data)
}

/** Answers with the **detail** shape, so the caller can route straight to it. */
export async function postAgentCode(input: AgentCodeWrite): Promise<AgentCodeDetailDto> {
  const response = await http.post(AGENT_CODE_ENDPOINTS.newCode, toWriteBody(input))
  return agentCodeDetailSchema.parse(response.data)
}

export async function patchAgentCode(id: number, input: AgentCodeWrite): Promise<AgentCodeDetailDto> {
  const response = await http.patch(AGENT_CODE_ENDPOINTS.code(id), toWriteBody(input))
  return agentCodeDetailSchema.parse(response.data)
}

/**
 * The list's toggle. Writes `status` and nothing else, and answers with the
 * **row** shape — no `summary`, so the tiles above the table do not update from
 * this call.
 */
export async function patchAgentCodeStatus(id: number, status: AgentCodeStatus): Promise<AgentCodeRowDto> {
  const response = await http.patch(AGENT_CODE_ENDPOINTS.codeStatus(id), { status })
  return agentCodeRowSchema.parse(response.data)
}

/** `204` with an empty body — nothing to parse. */
export async function deleteAgentCode(id: number): Promise<void> {
  await http.delete(AGENT_CODE_ENDPOINTS.code(id))
}
