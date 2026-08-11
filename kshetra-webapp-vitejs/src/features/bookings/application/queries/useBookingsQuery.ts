import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { bookingKeys } from '@/features/bookings/application/queries/booking.keys'
import { fetchBookings } from '@/features/bookings/application/usecases/fetchBookings'
import { fetchGods } from '@/features/bookings/application/usecases/fetchGods'
import { fetchPoojaris } from '@/features/bookings/application/usecases/fetchPoojaris'
import type { BookingFilters } from '@/features/bookings/domain/repositories/booking.repository'

/** Rosters and catalogues change when an admin edits them, not minute to minute. */
const CATALOGUE_STALE_TIME_MS = 10 * 60 * 1000

/**
 * One page of the feed.
 *
 * `keepPreviousData` is what stops the table blanking on every keystroke,
 * page turn and filter change: the previous page stays on screen, dimmed by
 * the caller, until the new one lands.
 */
export function useBookingsQuery(filters: BookingFilters) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: async () => unwrap(await fetchBookings(filters)),
    placeholderData: keepPreviousData,
  })
}

export function usePoojarisQuery() {
  return useQuery({
    queryKey: bookingKeys.poojaris(),
    queryFn: async () => unwrap(await fetchPoojaris()),
    staleTime: CATALOGUE_STALE_TIME_MS,
  })
}

export function useBookingGodsQuery() {
  return useQuery({
    queryKey: bookingKeys.gods(),
    queryFn: async () => unwrap(await fetchGods()),
    staleTime: CATALOGUE_STALE_TIME_MS,
  })
}
