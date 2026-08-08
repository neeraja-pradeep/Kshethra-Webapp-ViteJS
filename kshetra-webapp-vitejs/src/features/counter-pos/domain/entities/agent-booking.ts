import type { PaymentMethod } from './payment'

/**
 * A mobile-app booking made with an agent code, payable (or already paid) at
 * the counter — found and settled from the "Counter payments" flow.
 */
export interface AgentBooking {
  /** The id the record-payment endpoint takes. */
  readonly orderId: number
  /** Display reference, e.g. `KP-41`. */
  readonly orderRef: string
  readonly devotee: string
  readonly phone: string
  readonly code: string
  readonly poojaSummary: string
  readonly poojaCount: number
  /** ISO (yyyy-mm-dd) of the first pooja, or null if none is dated. */
  readonly firstPoojaDate: string | null
  readonly amount: number
  /** Both set only once the money has been taken. */
  readonly method: PaymentMethod | null
  readonly receiptNo: string | null
  readonly paid: boolean
}
