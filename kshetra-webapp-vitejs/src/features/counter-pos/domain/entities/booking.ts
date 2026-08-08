/**
 * A devotee/family member entered against the current walk-in booking only —
 * not a saved account. The server stores the name and nakshatra as a snapshot.
 */
export interface BookingPerson {
  /**
   * Client-side row id (`"P1"`). Sent verbatim as the API's `people[].ref`,
   * which links a line to its people; it is not stored.
   */
  readonly id: string
  readonly name: string
  readonly nakshatramId: number | null
}

/** One configured pooja line within the current walk-in booking (a cart line). */
export interface BookingLine {
  readonly id: string
  readonly poojaId: number
  readonly name: string
  readonly godName: string
  /**
   * Walk-in price per person per date at the time the line was added. An
   * estimate for display only — the server prices the sale authoritatively.
   */
  readonly base: number
  readonly peopleIds: readonly string[]
  /** ISO (yyyy-mm-dd) dates this pooja is booked for. */
  readonly dates: readonly string[]
  readonly remarks: string
}

/**
 * Server-side cap on `Σ people × dates` for one sale. Exceeding it fails the
 * whole request, so the cart checks before submitting rather than after.
 */
export const MAX_OCCURRENCES_PER_SALE = 500

/** How many order lines a booking will fan out into. */
export function countOccurrences(lines: readonly BookingLine[]): number {
  return lines.reduce((sum, line) => sum + line.peopleIds.length * line.dates.length, 0)
}
