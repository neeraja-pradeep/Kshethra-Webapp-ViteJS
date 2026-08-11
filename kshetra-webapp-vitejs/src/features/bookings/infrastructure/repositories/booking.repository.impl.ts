import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { Booking, BookingPoojari } from '@/features/bookings/domain/entities/booking'
import type {
  BookingFilters,
  BookingPage,
  BookingRepository,
} from '@/features/bookings/domain/repositories/booking.repository'
import {
  toBooking,
  toBookingSummary,
} from '@/features/bookings/infrastructure/data-sources/remote/booking.response'
import {
  getBookings,
  getGods,
  getPoojaris,
  postAssignPoojari,
  postCompleteBookings,
} from '@/features/bookings/infrastructure/data-sources/remote/bookings.api'
import { toPoojari } from '@/features/bookings/infrastructure/data-sources/remote/poojari.response'
import { toBookingGod, type BookingGod } from '@/features/bookings/infrastructure/data-sources/remote/god.response'

export const bookingRepository: BookingRepository = {
  async fetchBookings(filters: BookingFilters = {}): Promise<Result<BookingPage>> {
    try {
      const page = await getBookings(filters)
      return ok({
        count: page.count,
        results: page.results.map(toBooking),
        summary: toBookingSummary(page.summary),
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchPoojaris(): Promise<Result<readonly BookingPoojari[]>> {
    try {
      // Only activated accounts — the assign endpoint refuses the rest, so
      // offering them would be an error the operator could not have avoided.
      const rows = await getPoojaris()
      return ok(rows.filter((row) => row.is_activated).map(toPoojari))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchGods(): Promise<Result<readonly BookingGod[]>> {
    try {
      return ok((await getGods()).map(toBookingGod))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async completeBookings(bookingIds: readonly number[]): Promise<Result<readonly Booking[]>> {
    try {
      return ok((await postCompleteBookings(bookingIds)).map(toBooking))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async assignPoojari(bookingIds: readonly number[], poojariId: number): Promise<Result<readonly Booking[]>> {
    try {
      return ok((await postAssignPoojari(bookingIds, poojariId)).map(toBooking))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
