import type { PaymentMethod } from './payment'

export interface CollectionByMethod {
  readonly method: PaymentMethod
  readonly amount: number
}

/** Today's counter collection, derived from the day's transactions. */
export interface CollectionSummary {
  readonly totalAmount: number
  readonly poojaCount: number
  readonly transactionCount: number
  readonly byMethod: readonly CollectionByMethod[]
}
