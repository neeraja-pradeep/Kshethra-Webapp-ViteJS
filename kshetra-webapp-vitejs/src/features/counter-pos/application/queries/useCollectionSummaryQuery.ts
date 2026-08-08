import { useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { counterKeys } from '@/features/counter-pos/application/queries/counter-pos.keys'
import { fetchCollectionSummary } from '@/features/counter-pos/application/usecases/fetchCollectionSummary'

/** The day's takings move with every sale, so don't serve them stale. */
const SUMMARY_STALE_TIME_MS = 30 * 1000

/** @param date ISO `yyyy-mm-dd`. */
export function useCollectionSummaryQuery(date: string) {
  return useQuery({
    queryKey: counterKeys.summary(date),
    queryFn: async () => unwrap(await fetchCollectionSummary(date)),
    staleTime: SUMMARY_STALE_TIME_MS,
  })
}
