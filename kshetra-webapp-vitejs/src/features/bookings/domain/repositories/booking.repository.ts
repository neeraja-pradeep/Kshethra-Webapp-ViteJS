import type { Result } from '@/core/error/result'
import type { Booking, BookingPoojari, BookingSummary } from '@/features/bookings/domain/entities/booking'
import type { BookingGod } from '@/features/bookings/infrastructure/data-sources/remote/god.response'

/** `?poojari=unassigned` — bookings nobody is down to perform yet. */
export const UNASSIGNED_POOJARI = 'unassigned'

/**
 * Every filter here is applied by the server. Nothing is filtered client-side:
 * the list is paged, so narrowing one page would report a page total as if it
 * were the whole feed.
 */
export interface BookingFilters {
  /** Matches pooja, person, poojari, devotee, receipt no. and payer. */
  readonly search?: string
  /** ISO `yyyy-mm-dd`, inclusive. */
  readonly dateFrom?: string
  readonly dateTo?: string
  /** God id, from the pooja-category catalogue. */
  readonly god?: number
  readonly poojaType?: 'special' | 'regular'
  /** A poojari id, or `unassigned`. */
  readonly poojari?: number | typeof UNASSIGNED_POOJARI
  readonly channel?: 'counter' | 'app'
  readonly status?: 'pending' | 'completed' | 'cancelled'
  /** A `BookingSortField`, optionally `-` prefixed. */
  readonly sort?: string
  readonly page?: number
  /** Max 100 server-side. */
  readonly pageSize?: number
}

/** The sortable columns the server recognises. Anything else is a `400`. */
export type BookingSortField = 'pooja' | 'pooja_date' | 'person' | 'poojari' | 'booking_status' | 'order' | 'created_at'

/** A page of the feed, plus counts over the whole filtered set. */
export interface BookingPage {
  readonly count: number
  readonly results: readonly Booking[]
  readonly summary: BookingSummary
}

export interface BookingRepository {
  fetchBookings(filters?: BookingFilters): Promise<Result<BookingPage>>
  /** Activated poojaris — the same set the assign endpoint will accept. */
  fetchPoojaris(): Promise<Result<readonly BookingPoojari[]>>
  /** Gods, for the filter dropdown. */
  fetchGods(): Promise<Result<readonly BookingGod[]>>
  /**
   * Records the poojas as performed. All-or-nothing: one refusal fails the
   * whole request untouched, so a half-applied bulk action cannot happen.
   * Returns the rows as they now stand.
   */
  completeBookings(bookingIds: readonly number[]): Promise<Result<readonly Booking[]>>
  /** Hands the bookings to a poojari, starting each one's completion window. */
  assignPoojari(bookingIds: readonly number[], poojariId: number): Promise<Result<readonly Booking[]>>
}
