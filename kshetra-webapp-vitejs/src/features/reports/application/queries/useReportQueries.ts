import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { reportKeys } from '@/features/reports/application/queries/report.keys'
import { exportReport } from '@/features/reports/application/usecases/exportReport'
import { fetchReport } from '@/features/reports/application/usecases/fetchReport'
import { fetchReportCatalogue } from '@/features/reports/application/usecases/fetchReportCatalogue'
import { fetchReportOptions } from '@/features/reports/application/usecases/fetchReportOptions'
import type { ReportExportFormat, ReportQuery } from '@/features/reports/domain/entities/report'

/** Catalogue metadata changes on deploy, not during a session. */
const CATALOGUE_STALE_TIME_MS = 5 * 60 * 1000

/**
 * The card grid and every report's columns, filters and defaults.
 *
 * One call drives the whole screen — nothing about a report is hardcoded here,
 * so a report added server-side appears without a frontend release.
 */
export function useReportCatalogueQuery() {
  return useQuery({
    queryKey: reportKeys.catalogue(),
    queryFn: async () => unwrap(await fetchReportCatalogue()),
    staleTime: CATALOGUE_STALE_TIME_MS,
  })
}

/**
 * One page of one report.
 *
 * `keepPreviousData` holds the table steady while a filter or a page change is
 * in flight, rather than blanking it between every request.
 */
export function useReportQuery(slug: string | null, query: ReportQuery) {
  return useQuery({
    queryKey: reportKeys.rows(slug ?? '', query),
    queryFn: async () => unwrap(await fetchReport(slug as string, query)),
    enabled: slug !== null,
    placeholderData: keepPreviousData,
  })
}

/**
 * A filter's dropdown contents.
 *
 * Only fetched for a filter that names an `optionsSource` — the short lists
 * arrive embedded in the catalogue and need no request.
 */
export function useReportOptionsQuery(source: string | null, search = '') {
  return useQuery({
    queryKey: reportKeys.options(source ?? '', search),
    queryFn: async () => unwrap(await fetchReportOptions(source as string, search || undefined)),
    enabled: source !== null,
    staleTime: CATALOGUE_STALE_TIME_MS,
  })
}

/**
 * The download.
 *
 * A mutation rather than a query: it is an action with a side effect (a file
 * lands in the user's downloads), it must not run on mount, and it must not be
 * cached — asking twice means the admin wants the file twice.
 */
export function useReportExportMutation() {
  return useMutation({
    mutationFn: async ({
      slug,
      format,
      query,
    }: {
      slug: string
      format: ReportExportFormat
      query: ReportQuery
    }) => unwrap(await exportReport(slug, format, query)),
  })
}
