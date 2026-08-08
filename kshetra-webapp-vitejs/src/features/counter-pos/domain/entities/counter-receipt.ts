import type { PaymentMethod } from './payment'

/** Walk-in sale, or an app agent-code booking settled at the desk. */
export type CounterSaleType = 'walk_in' | 'agent_booking'

export type CounterReceiptStatus = 'completed' | 'cancelled'

export interface ReceiptPerson {
  readonly name: string
  /** Snapshot name, not an id — the server stores it as text on the order line. */
  readonly nakshatram: string
}

/** One pooja line on a receipt: one (pooja, people, dates) configuration. */
export interface CounterReceiptItem {
  readonly poojaId: number
  readonly name: string
  readonly god: string
  /** Price per person per date. */
  readonly base: number
  /** ISO (yyyy-mm-dd), sorted. */
  readonly dates: readonly string[]
  readonly people: readonly ReceiptPerson[]
  readonly peopleCount: number
  /** people x dates. */
  readonly count: number
  readonly cancelledCount: number
  /** Authoritative — excludes cancelled occurrences, so it may be < base x count. */
  readonly amount: number
  readonly remarks: string
}

/**
 * A completed counter sale, exactly as the server recorded it. Everything here
 * comes back from the API: the receipt number, the total and the staff name are
 * the server's, never computed in the browser.
 */
export interface CounterReceipt {
  readonly id: number
  /** e.g. `RCP-1042`. Numbers may have gaps — they are derived from the row id. */
  readonly receiptNo: string
  readonly saleType: CounterSaleType
  readonly staffName: string
  readonly paymentMethod: PaymentMethod
  readonly total: number
  readonly poojaCount: number
  readonly customerName: string
  readonly customerPhone: string
  readonly status: CounterReceiptStatus
  readonly cancelReason: string
  /** ISO-8601 timestamp. */
  readonly createdAt: string
  readonly orderIds: readonly number[]
  readonly items: readonly CounterReceiptItem[]
}

/** Every distinct person named across a receipt, in first-seen order. */
export function receiptDevotees(receipt: CounterReceipt): readonly ReceiptPerson[] {
  const seen = new Map<string, ReceiptPerson>()
  for (const item of receipt.items) {
    for (const person of item.people) {
      const key = `${person.name}|${person.nakshatram}`
      if (!seen.has(key)) seen.set(key, person)
    }
  }
  return [...seen.values()]
}
