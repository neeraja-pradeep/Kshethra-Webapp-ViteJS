import { useEffect, useMemo, useRef, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { Alert, Icon, Spinner } from '@/shared/ui'
import { formatCount } from '@/shared/lib/format'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import {
  useReportCatalogueQuery,
  useReportExportMutation,
  useReportQuery,
} from '@/features/reports/application/queries/useReportQueries'
import type { ReportExportFormat, ReportQuery } from '@/features/reports/domain/entities/report'
import { ReportCatalogue } from '@/features/reports/presentation/components/ReportCatalogue'
import { ReportEmptyState } from '@/features/reports/presentation/components/ReportEmptyState'
import { ReportExportPanel } from '@/features/reports/presentation/components/ReportExportPanel'
import { ReportFilterBar } from '@/features/reports/presentation/components/ReportFilterBar'
import { ReportPagination } from '@/features/reports/presentation/components/ReportPagination'
import { ReportResultsTable } from '@/features/reports/presentation/components/ReportResultsTable'
import { ReportToast } from '@/features/reports/presentation/components/ReportToast'
import { useReportOptions } from '@/features/reports/presentation/lib/useReportOptions'
import { nextSort } from '@/features/reports/presentation/lib/reportCells'

const TOAST_MS = 2600
/** One request per pause in typing, not per keystroke. */
const SEARCH_DEBOUNCE_MS = 300
const CUSTOM_PERIOD = 'custom'

/**
 * Reports. Route: `/reports`.
 *
 * Every report is served by the same three endpoints, and **nothing about any
 * of them is hardcoded here** — the cards, their icons, each report's columns,
 * its filters, those filters' dropdown contents, the period presets and the
 * page-size cap all arrive from `report/catalogue/`. A report added
 * server-side appears with no frontend release.
 *
 * All filtering, sorting and paging is the server's. Nothing is done locally:
 * the list is paged, so narrowing the loaded rows would report one page's
 * matches as though it were the whole set, and `totals` is counted over
 * everything the filters match rather than over what is on screen.
 */
export function ReportsScreen() {
  const can = useCan()
  const canExport = can(PERMISSIONS.exportReports)

  const catalogueQuery = useReportCatalogueQuery()
  const catalogue = catalogueQuery.data ?? null

  const [slug, setSlug] = useState<string | null>(null)
  const [period, setPeriod] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState('')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState<string | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const definition = useMemo(
    () => catalogue?.reports.find((r) => r.slug === slug) ?? null,
    [catalogue, slug],
  )

  /** The first report the caller may actually run opens by default. */
  useEffect(() => {
    if (slug !== null || !catalogue) return
    const first = catalogue.reports.find((r) => r.permitted) ?? catalogue.reports[0]
    if (first) selectReport(first.slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogue, slug])

  /** A search filter fires one request per pause, not per keystroke. */
  useEffect(() => {
    const id = setTimeout(() => setDebouncedFilters(filterValues), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [filterValues])

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [],
  )

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS)
  }

  /**
   * Opening a report resets to **its own** defaults — the server states each
   * report's default period and sort, and carrying the last report's over would
   * ask a question this one was never meant to answer.
   */
  function selectReport(nextSlug: string) {
    const next = catalogue?.reports.find((r) => r.slug === nextSlug) ?? null
    setSlug(nextSlug)
    setPeriod(next?.defaultPeriod ?? '')
    setSort(next?.defaultSort ?? '')
    setDateFrom('')
    setDateTo('')
    const seeded = Object.fromEntries(
      (next?.filters ?? [])
        .filter((f) => f.type !== 'date_range' && f.defaultValue)
        .map((f) => [f.key, f.defaultValue as string]),
    )
    setFilterValues(seeded)
    setDebouncedFilters(seeded)
    setPage(1)
  }

  const query: ReportQuery = useMemo(
    () => ({
      ...(period ? { period } : {}),
      ...(period === CUSTOM_PERIOD && dateFrom ? { dateFrom } : {}),
      ...(period === CUSTOM_PERIOD && dateTo ? { dateTo } : {}),
      ...(sort ? { sort } : {}),
      page,
      pageSize: catalogue?.defaultPageSize,
      filters: debouncedFilters,
    }),
    [period, dateFrom, dateTo, sort, page, catalogue, debouncedFilters],
  )

  const reportQuery = useReportQuery(slug, query)
  const exportMutation = useReportExportMutation()
  const fetchedOptions = useReportOptions(definition?.filters ?? [])

  const result = reportQuery.data ?? null
  const columns = result?.report.columns ?? definition?.columns ?? []
  const rows = result?.rows ?? []
  const totalRows = result?.count ?? 0

  function handleFilterChange(key: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function handleReset() {
    if (slug) selectReport(slug)
  }

  function handleSort(key: string) {
    setSort((current) => nextSort(current, key))
    setPage(1)
  }

  /**
   * Saves the file the server built, under the name the server gave it — the
   * filename carries a timestamp, so naming it here would lose that.
   */
  function handleExport(format: ReportExportFormat) {
    if (!slug) return
    exportMutation.mutate(
      { slug, format, query },
      {
        onSuccess: (file) => {
          const url = URL.createObjectURL(file.blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = file.filename
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          window.setTimeout(() => URL.revokeObjectURL(url), 4000)
          showToast(`Exported ${formatCount(totalRows)} rows (${format.toUpperCase()})`)
        },
      },
    )
  }

  const catalogueFailure = catalogueQuery.isError
    ? (toFailure(catalogueQuery.error)?.message ?? 'The report catalogue could not be loaded.')
    : null
  const rowsFailure = reportQuery.isError
    ? (toFailure(reportQuery.error)?.message ?? 'This report could not be run.')
    : null
  const exportFailure = exportMutation.isError
    ? (toFailure(exportMutation.error)?.message ?? 'The export could not be prepared.')
    : null

  const pageCount = result?.totalPages ?? 1
  const firstRow = totalRows === 0 ? 0 : (page - 1) * (result?.pageSize ?? 1) + 1
  const lastRow = Math.min(totalRows, page * (result?.pageSize ?? 0))
  const pageInfo = totalRows ? `Showing ${firstRow}–${lastRow} of ${formatCount(totalRows)} rows` : 'No rows'
  const pageLabel = `Page ${page} of ${pageCount}`

  const showTable = !!result && rows.length > 0
  const showEmpty = !!result && rows.length === 0 && !rowsFailure

  if (catalogueQuery.isPending) {
    return (
      <div className="flex h-full items-center justify-center bg-sunken">
        <Spinner size={40} />
      </div>
    )
  }

  if (catalogueFailure || !catalogue) {
    return (
      <div className="flex h-full flex-col gap-4 bg-sunken px-7 pt-5.5">
        <Alert type="danger" icon={<Icon name="warning" size={16} />}>
          {catalogueFailure ?? 'The report catalogue could not be loaded.'}
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex shrink-0 items-center gap-4 px-7 pb-3 pt-5.5">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Reports</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Pick a report, set the filters, and export the result set.</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-7 pb-6 pt-0.5">
        <ReportCatalogue
          groups={catalogue.groups}
          reports={catalogue.reports}
          selectedSlug={slug}
          onSelect={selectReport}
        />

        {definition && (
          <ReportFilterBar
            filters={definition.filters}
            periods={catalogue.periods}
            hasPeriod={definition.hasPeriod}
            periodField={definition.periodField}
            period={period}
            dateFrom={dateFrom}
            dateTo={dateTo}
            values={filterValues}
            fetchedOptions={fetchedOptions}
            onPeriodChange={(value) => {
              setPeriod(value)
              setPage(1)
            }}
            onDateFromChange={(value) => {
              setDateFrom(value)
              setPage(1)
            }}
            onDateToChange={(value) => {
              setDateTo(value)
              setPage(1)
            }}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />
        )}

        {(rowsFailure || exportFailure) && (
          <Alert type="danger" icon={<Icon name="warning" size={16} />}>
            {rowsFailure ?? exportFailure}
          </Alert>
        )}

        <div className="flex min-h-80 shrink-0 flex-col gap-3.5">
          {reportQuery.isPending && slug !== null && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-card py-16 text-ink-subtle shadow-sm">
              <Spinner size={28} />
              <span className="text-sm">Running report…</span>
            </div>
          )}

          {showTable && result && definition && (
            <>
              <ReportExportPanel
                reportName={result.report.label}
                resultLabel={formatCount(totalRows)}
                exportBusy={exportMutation.isPending}
                formats={definition.exports}
                canExport={canExport}
                onExportCsv={() => handleExport('csv')}
                onExportXls={() => handleExport('xlsx')}
              />
              <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
                <ReportResultsTable
                  columns={columns}
                  rows={rows}
                  sort={result.sort}
                  onSort={handleSort}
                  totals={result.totals}
                  totalRowCount={totalRows}
                  loading={reportQuery.isFetching}
                />
              </div>
              <ReportPagination
                pageInfo={pageInfo}
                pageLabel={pageLabel}
                prevDisabled={!result.hasPrevious}
                nextDisabled={!result.hasNext}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            </>
          )}

          {showEmpty && (
            <div className="rounded-2xl bg-card shadow-sm">
              <ReportEmptyState
                icon="magnifying-glass"
                message="No rows match the current filters."
                showClearFilters
                onClearFilters={handleReset}
              />
            </div>
          )}
        </div>
      </div>

      {toast && <ReportToast message={toast} />}
    </div>
  )
}
