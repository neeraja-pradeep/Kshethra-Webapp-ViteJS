import type { Result } from '@/core/error/result'
import type {
  AgentCode,
  AgentCodeDetail,
  AgentCodePage,
  AgentCodeStatus,
  AgentCodeValidityState,
  AgentCodeWrite,
} from '@/features/agent-codes/domain/entities/agent-code'

/**
 * Every filter here is applied by the server. Nothing is filtered client-side:
 * the list is paged, so narrowing one page would report a page's worth of
 * matches as though it were the whole screen — and the search reaches a
 * Malayalam description by its romanized spelling, which no client-side match
 * over the loaded rows could find.
 */
export interface AgentCodeFilters {
  /** Case-insensitive partial match on **code or description**. */
  readonly search?: string
  readonly status?: AgentCodeStatus
  /** Derived from the window and the clock — not the same question as `status`. */
  readonly validity?: AgentCodeValidityState
  /** An {@link AgentCodeOrdering}, optionally `-` prefixed. Anything else is a 400. */
  readonly ordering?: string
  readonly page?: number
  /** Default 20, max 100 server-side. */
  readonly pageSize?: number
}

/**
 * The sortable columns. `validity` sorts on the **start** of the window, because
 * the column prints a range and a range cannot be sorted as one value.
 */
export type AgentCodeOrdering =
  | 'code'
  | 'description'
  | 'validity'
  | 'uses'
  | 'order_value'
  | 'status'
  | 'created_at'

export interface AgentCodeRepository {
  fetchAgentCodes(filters?: AgentCodeFilters): Promise<Result<AgentCodePage>>
  fetchAgentCode(id: number): Promise<Result<AgentCodeDetail>>
  createAgentCode(input: AgentCodeWrite): Promise<Result<AgentCodeDetail>>
  /** Partial: `null` clears a field, absent leaves it alone. */
  updateAgentCode(id: number, input: AgentCodeWrite): Promise<Result<AgentCodeDetail>>
  /**
   * The list's toggle. Returns the row, not the detail — and carries no
   * summary, so the tiles must be refetched rather than derived from it.
   */
  setAgentCodeStatus(id: number, status: AgentCodeStatus): Promise<Result<AgentCode>>
  /**
   * Permanent. Refused with a `400` when the code has bookings or sits in a
   * live cart; the failure's `details` carry `bookings` and `active_carts` so
   * the caller can say which guard tripped.
   */
  deleteAgentCode(id: number): Promise<Result<void>>
}
