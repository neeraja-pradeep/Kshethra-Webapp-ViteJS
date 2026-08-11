import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { bookingKeys } from '@/features/bookings/application/queries/booking.keys'
import { assignPoojari } from '@/features/bookings/application/usecases/assignPoojari'
import { completeBookings } from '@/features/bookings/application/usecases/completeBookings'

/**
 * Both actions change what the list and its summary tiles say, so both
 * invalidate the whole feed rather than patching rows in place — completing one
 * booking can also roll its parent order up to a new status.
 */
function useBookingInvalidation() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: bookingKeys.all })
}

export function useCompleteBookingsMutation() {
  const invalidate = useBookingInvalidation()
  return useMutation({
    mutationFn: async (bookingIds: readonly number[]) => unwrap(await completeBookings(bookingIds)),
    onSuccess: invalidate,
  })
}

export function useAssignPoojariMutation() {
  const invalidate = useBookingInvalidation()
  return useMutation({
    mutationFn: async ({ bookingIds, poojariId }: { bookingIds: readonly number[]; poojariId: number }) =>
      unwrap(await assignPoojari(bookingIds, poojariId)),
    onSuccess: invalidate,
  })
}
