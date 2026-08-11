import type { Result } from '@/core/error/result'
import type { Booking } from '@/features/bookings/domain/entities/booking'
import { bookingRepository } from '@/features/bookings/infrastructure/repositories/booking.repository.impl'

/** All-or-nothing across the ids — the server refuses the whole set or none. */
export function completeBookings(bookingIds: readonly number[]): Promise<Result<readonly Booking[]>> {
  return bookingRepository.completeBookings(bookingIds)
}
