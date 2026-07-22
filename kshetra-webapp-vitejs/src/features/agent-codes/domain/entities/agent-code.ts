/** Domain types for the Agent code feature. Plain data — no logic, no React. */

/** Whether devotees can currently apply the code in the app. */
export type AgentCodeStatus = 'Active' | 'Inactive'

/** Derived validity window relative to "now" (not stored — computed from from/to). */
export type AgentCodeValidityState = 'active' | 'scheduled' | 'expired'

/**
 * A code devotees apply in the app so a booking becomes payable at the
 * temple counter instead of online.
 */
export interface AgentCode {
  readonly id: string
  /** Short uppercase code the devotee types in the app, e.g. "TEMPLE50". */
  readonly code: string
  readonly description: string
  /** Validity window start, datetime-local string e.g. "2026-06-01T00:00". */
  readonly from: string
  /** Validity window end, datetime-local string. */
  readonly to: string
  /** Max number of bookings this code can be applied to. 0 = unlimited. */
  readonly limit: number
  readonly status: AgentCodeStatus
}
