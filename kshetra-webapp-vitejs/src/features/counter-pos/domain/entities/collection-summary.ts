import type { PaymentMethod } from './payment'

export interface CollectionByMethod {
  readonly method: PaymentMethod
  readonly amount: number
}

/**
 * What the counter has taken in on a given day, as the server totals it.
 * Every tender is always present (zeros included) so the KPI band never
 * reflows. Cancelled receipts are excluded — that money went back.
 */
export interface CollectionSummary {
  /** ISO `yyyy-mm-dd` the figures are for. */
  readonly date: string
  readonly totalAmount: number
  readonly poojaCount: number
  readonly transactionCount: number
  readonly byMethod: readonly CollectionByMethod[]
}
