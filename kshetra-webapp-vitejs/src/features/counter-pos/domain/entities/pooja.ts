import type { SpecialPoojaDate } from './special-pooja-date'

/** A catalogue pooja counter staff can add to a walk-in booking. */

export type PoojaStatus = 'Active' | 'Inactive'

export interface Pooja {
  readonly id: number
  readonly name: string
  /** Gods this pooja is offered to (display name resolved via god id). */
  readonly godIds: readonly number[]
  /** Walk-in counter price, per person per date. */
  readonly offlinePrice: number
  readonly status: PoojaStatus
  /** Special poojas may only be booked on a published date. */
  readonly isSpecial: boolean
  /** Active, upcoming dates only — empty for a regular pooja. */
  readonly specialDates: readonly SpecialPoojaDate[]
}

/**
 * Price for one person on one date. A special pooja's published date may carry
 * its own price; the server applies the same rule when it bills the sale.
 */
export function priceForDate(pooja: Pooja, isoDate: string): number {
  if (!pooja.isSpecial) return pooja.offlinePrice
  const published = pooja.specialDates.find((d) => d.date === isoDate)
  return published?.offlinePrice ?? pooja.offlinePrice
}
