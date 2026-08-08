import { useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { counterKeys } from '@/features/counter-pos/application/queries/counter-pos.keys'
import { fetchAgentBookings } from '@/features/counter-pos/application/usecases/fetchAgentBookings'
import type { AgentBookingFilters } from '@/features/counter-pos/domain/repositories/counter.repository'

interface UseAgentBookingsQueryOptions extends AgentBookingFilters {
  /** Skip the request until the modal that needs it is actually open. */
  readonly enabled?: boolean
}

export function useAgentBookingsQuery({ enabled = true, ...filters }: UseAgentBookingsQueryOptions) {
  return useQuery({
    queryKey: counterKeys.agentBookingList(filters),
    queryFn: async () => unwrap(await fetchAgentBookings(filters)),
    enabled,
    // A settlement elsewhere changes this list; treat it as always worth re-reading.
    staleTime: 0,
  })
}
