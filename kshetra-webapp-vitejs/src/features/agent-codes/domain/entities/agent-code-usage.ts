/** Domain types for bookings paid for using an agent code. No logic, no React. */

/**
 * One booking a devotee paid for at the counter using an agent code.
 * Denormalizes the devotee name and pooja summary so this feature stays
 * decoupled from the bookings/devotees features.
 */
export interface AgentCodeUsage {
  readonly orderRef: string
  /** The AgentCode.code this booking used. */
  readonly code: string
  readonly devotee: string
  /** e.g. "Ganapathi Homam · 1 devotee". */
  readonly poojaSummary: string
  /** Display-ready short date, e.g. "18 Jul 26". */
  readonly date: string
  readonly amount: number
  /** true = paid online already, false = payable at counter. */
  readonly paid: boolean
}
