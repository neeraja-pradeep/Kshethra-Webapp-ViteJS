import type { Nakshatra } from './nakshatra'

/**
 * A devotee/family member entered against the current walk-in booking only —
 * not a saved account.
 */
export interface BookingPerson {
  readonly id: string
  readonly name: string
  readonly nakshatra: Nakshatra | ''
}

/** One configured pooja line within the current walk-in booking (a cart line). */
export interface BookingLine {
  readonly id: string
  readonly poojaId: string
  readonly name: string
  readonly godName: string
  /** Walk-in price per person per date, copied from the catalogue at add-time. */
  readonly base: number
  readonly peopleIds: readonly string[]
  /** ISO (yyyy-mm-dd) dates this pooja is booked for. */
  readonly dates: readonly string[]
  readonly remarks: string
}
