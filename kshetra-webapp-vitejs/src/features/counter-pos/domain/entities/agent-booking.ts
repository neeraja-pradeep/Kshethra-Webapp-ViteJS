import type { PaymentMethod } from './payment'

/**
 * A mobile-app booking made with an agent code, payable (or already paid) at
 * the counter — found and settled from the "Counter payments" flow.
 */
export interface AgentBooking {
  readonly orderRef: string
  readonly devotee: string
  readonly phone: string
  readonly code: string
  readonly poojaSummary: string
  readonly poojaCount: number
  /** Display date of the first pooja, e.g. "20 Jul 2026". */
  readonly date: string
  readonly amount: number
  /** Set once the counter payment has been recorded. */
  readonly method: PaymentMethod | null
  readonly paid: boolean
}
