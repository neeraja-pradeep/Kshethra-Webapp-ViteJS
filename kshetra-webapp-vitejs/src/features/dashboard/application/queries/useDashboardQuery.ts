import { useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { dashboardKeys } from '@/features/dashboard/application/queries/dashboard.keys'
import { fetchDashboard } from '@/features/dashboard/application/usecases/fetchDashboard'

/**
 * The whole landing screen in one query.
 *
 * No `placeholderData`: there is nothing to page or filter, so a refetch only
 * happens when the app's 60s `staleTime` has already lapsed — and holding a
 * stale takings figure on screen under a spinner would be worse than the one
 * load this screen does.
 */
export function useDashboardQuery() {
  return useQuery({
    queryKey: dashboardKeys.snapshot(),
    queryFn: async () => unwrap(await fetchDashboard()),
  })
}
