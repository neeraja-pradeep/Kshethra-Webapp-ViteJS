import type { Result } from '@/core/error/result'
import type { Booking } from '@/features/bookings/domain/entities/booking'
import { bookingRepository } from '@/features/bookings/infrastructure/repositories/booking.repository.impl'

export function assignPoojari(bookingIds: readonly number[], poojariId: number): Promise<Result<readonly Booking[]>> {
  return bookingRepository.assignPoojari(bookingIds, poojariId)
}
