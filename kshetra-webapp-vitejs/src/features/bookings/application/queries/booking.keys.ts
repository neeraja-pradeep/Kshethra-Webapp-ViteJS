import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { BookingFilters } from '@/features/bookings/domain/repositories/booking.repository'

/** The only place bookings query keys are constructed. */
export const bookingKeys = {
  all: QUERY_ROOTS.bookings,
  list: (filters: BookingFilters) => [...bookingKeys.all, 'list', filters] as const,
  poojaris: () => [...bookingKeys.all, 'poojaris'] as const,
  gods: () => [...bookingKeys.all, 'gods'] as const,
}
