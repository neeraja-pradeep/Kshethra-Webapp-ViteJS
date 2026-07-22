/**
 * One point on the "Bookings per day — next 7 days" bar chart. `date` is
 * ISO (yyyy-mm-dd); `isToday` flags the first bar so the UI can emphasise it.
 */
export interface BookingsTrendPoint {
  readonly date: string
  readonly count: number
  readonly isToday: boolean
}

/**
 * One point on the "Counter collections — last 7 days" mini bar chart.
 * `amount` is a raw rupee number (the UI formats it for the bar tooltip).
 */
export interface CounterCollectionPoint {
  readonly date: string
  readonly amount: number
  readonly isToday: boolean
}
