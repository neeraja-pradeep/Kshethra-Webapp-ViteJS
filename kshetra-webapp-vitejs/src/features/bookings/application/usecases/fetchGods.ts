import type { Result } from '@/core/error/result'
import type { BookingGod } from '@/features/bookings/infrastructure/data-sources/remote/god.response'
import { bookingRepository } from '@/features/bookings/infrastructure/repositories/booking.repository.impl'

export function fetchGods(): Promise<Result<readonly BookingGod[]>> {
  return bookingRepository.fetchGods()
}
