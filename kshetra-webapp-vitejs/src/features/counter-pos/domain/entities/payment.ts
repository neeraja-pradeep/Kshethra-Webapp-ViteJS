/** How a devotee settled a counter sale (or an app-agent-code booking). */
export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Net banking'

/** A single settlement recorded against an order at the counter. */
export interface PaymentRecord {
  readonly method: PaymentMethod
  readonly amount: number
  readonly recordedAt: string
  readonly staffName: string
}
