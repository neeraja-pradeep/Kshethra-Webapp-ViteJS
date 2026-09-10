import { useQueries } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { reportKeys } from '@/features/reports/application/queries/report.keys'
import { fetchReportOptions } from '@/features/reports/application/usecases/fetchReportOptions'
import type { ReportFilter, ReportFilterOption } from '@/features/reports/domain/entities/report'

/** Lookups change on deploy, not during a session. */
const OPTIONS_STALE_TIME_MS = 5 * 60 * 1000

/**
 * The dropdown contents for every filter on the active report that names an
 * `optionsSource`, keyed by source.
 *
 * Only fetched for a **truncated** list: the catalogue embeds the options
 * inline when the list is short enough, and re-requesting those would be a
 * round trip for something already in hand. Two filters naming the same source
 * share one request, because the key is the source.
 */
export function useReportOptions(
  filters: readonly ReportFilter[],
): Readonly<Record<string, readonly ReportFilterOption[]>> {
  const sources = Array.from(
    new Set(filters.filter((f) => f.optionsSource && f.truncated).map((f) => f.optionsSource as string)),
  )

  const results = useQueries({
    queries: sources.map((source) => ({
      queryKey: reportKeys.options(source, ''),
      queryFn: async () => unwrap(await fetchReportOptions(source)),
      staleTime: OPTIONS_STALE_TIME_MS,
    })),
  })

  return Object.fromEntries(
    sources.flatMap((source, index) => {
      const data = results[index]?.data
      return data ? [[source, data] as const] : []
    }),
  )
}
