/** A catalogue pooja counter staff can add to a walk-in booking. */

export type PoojaStatus = 'Active' | 'Inactive'

export interface Pooja {
  readonly id: string
  readonly name: string
  /** Gods this pooja is offered to (denormalized display name is looked up via god id). */
  readonly godIds: readonly string[]
  /** Walk-in counter price, per person per date. */
  readonly offlinePrice: number
  readonly status: PoojaStatus
}
