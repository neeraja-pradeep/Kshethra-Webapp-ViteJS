import type { Nakshatra } from './nakshatra'
import type { PaymentMethod } from './payment'

export interface TransactionPerson {
  readonly name: string
  readonly nakshatra: Nakshatra | ''
}

/** One pooja line within a completed sale (mirrors a booking line at the time of sale). */
export interface TransactionItem {
  readonly name: string
  readonly god: string
  /** ISO (yyyy-mm-dd) dates this pooja was performed for. */
  readonly dates: readonly string[]
  readonly peopleCount: number
  /** peopleCount x dates.length */
  readonly count: number
  readonly amount: number
  /** Walk-in price per person per date; absent on seeded/demo transactions. */
  readonly base?: number
  readonly people?: readonly TransactionPerson[]
  readonly remarks?: string
}

/** A completed counter sale — the record a printed receipt is generated from. */
export interface Transaction {
  /** Receipt number, e.g. "RCP-1042". */
  readonly rcp: string
  readonly time: string
  readonly date: string
  readonly devotees: readonly TransactionPerson[]
  readonly items: readonly TransactionItem[]
  readonly total: number
  readonly method: PaymentMethod
  readonly staff: string
  readonly poojaCount: number
}
