/**
 * A published date a special pooja may be booked on.
 *
 * A special pooja rejects any other date outright, so this list is what the
 * booking calendar is allowed to offer.
 */
export interface SpecialPoojaDate {
  readonly id: number
  /** ISO `yyyy-mm-dd`. */
  readonly date: string
  /**
   * Walk-in price for this date specifically. Overrides the pooja's own
   * `offlinePrice` when set — the server prices it that way too.
   */
  readonly offlinePrice: number | null
}
