import type { Result } from '@/core/error/result'
import type { BookingPoojari } from '@/features/bookings/domain/entities/booking'
import { bookingRepository } from '@/features/bookings/infrastructure/repositories/booking.repository.impl'

export function fetchPoojaris(): Promise<Result<readonly BookingPoojari[]>> {
  return bookingRepository.fetchPoojaris()
}
