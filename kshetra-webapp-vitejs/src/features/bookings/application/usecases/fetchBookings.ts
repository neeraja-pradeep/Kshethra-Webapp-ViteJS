import type { Result } from '@/core/error/result'
import type { BookingFilters, BookingPage } from '@/features/bookings/domain/repositories/booking.repository'
import { bookingRepository } from '@/features/bookings/infrastructure/repositories/booking.repository.impl'

export function fetchBookings(filters?: BookingFilters): Promise<Result<BookingPage>> {
  return bookingRepository.fetchBookings(filters)
}
