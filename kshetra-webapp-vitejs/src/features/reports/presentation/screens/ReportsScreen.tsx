import { useEffect, useMemo, useRef, useState } from 'react'

import { Spinner } from '@/shared/ui'
import { formatCount } from '@/shared/lib/format'

import { ReportCatalogue } from '@/features/reports/presentation/components/ReportCatalogue'
import { ReportEmptyState } from '@/features/reports/presentation/components/ReportEmptyState'
import { ReportExportPanel } from '@/features/reports/presentation/components/ReportExportPanel'
import { ReportFilterBar } from '@/features/reports/presentation/components/ReportFilterBar'
import { ReportPagination } from '@/features/reports/presentation/components/ReportPagination'
import { ReportPendingBanner } from '@/features/reports/presentation/components/ReportPendingBanner'
import { ReportResultsTable } from '@/features/reports/presentation/components/ReportResultsTable'
import { ReportToast } from '@/features/reports/presentation/components/ReportToast'
import { REPORT_CATEGORIES, REPORTS } from '@/features/reports/presentation/data/reports-catalogue.mock'
import { REPORT_ROWS } from '@/features/reports/presentation/data/report-rows.mock'

import type { DateRangePreset, ReportDefinition, ReportFilterState, ReportGroup, ReportId, ReportRow } from '@/features/reports/domain/entities/report'

/** Fixed "today" the mock dataset is anchored to — the seed data runs up to this date. */
const TODAY_ISO = '2026-07-15'
const DEFAULT_MONTH_START = '2026-07-01'
const YEAR_START = '2026-01-01'
const PAGE_SIZE = 15

const DATASETS: Record<ReportId, readonly ReportRow[]> = REPORT_ROWS as unknown as Record<ReportId, readonly ReportRow[]>

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function rangeFor(preset: DateRangePreset, from: string, to: string): readonly [string, string] {
  if (preset === 'Today') return [TODAY_ISO, TODAY_ISO]
  if (preset === 'This week') return [addDays(TODAY_ISO, -6), TODAY_ISO]
  if (preset === 'This month') return [DEFAULT_MONTH_START, TODAY_ISO]
  if (preset === 'This quarter') return [DEFAULT_MONTH_START, TODAY_ISO]
  if (preset === 'This year') return [YEAR_START, TODAY_ISO]
  return [from, to]
}

function buildDefaultFilters(report: ReportDefinition): ReportFilterState {
  const extra: Record<string, string> = {}
  report.filters.forEach((filter) => {
    extra[filter.key] = 'all'
  })
  return { preset: 'This month', from: DEFAULT_MONTH_START, to: TODAY_ISO, extra }
}

type FieldValue = string | number | null

function readField(row: ReportRow, key: string): FieldValue {
  const record = row as unknown as Record<string, string | number | null | undefined>
  const value = record[key]
  return value == null ? null : value
}

function applyFilters(report: ReportDefinition, rows: readonly ReportRow[], filters: ReportFilterState): ReportRow[] {
  let result = rows.slice()

  if (!report.noDate) {
    const [from, to] = rangeFor(filters.preset, filters.from, filters.to)
    result = result.filter((row) => {
      const date = readField(row, 'date')
      return date == null || (String(date) >= from && String(date) <= to)
    })
  }

  report.filters.forEach((filterDef) => {
    const value = filters.extra[filterDef.key]
    if (!value || value === 'all') return
    if (report.id === 'volume' && filterDef.key === 'status') {
      result = result.filter((row) => (value === 'Completed' ? Number(readField(row, 'completed')) > 0 : Number(readField(row, 'cancelled')) > 0))
      return
    }
    if (report.id === 'inventory' && filterDef.key === 'low') {
      result = result.filter((row) => readField(row, 'flag') !== 'In stock')
      return
    }
    result = result.filter((row) => String(readField(row, filterDef.key)) === value)
  })

  return result
}

function sortRows(rows: readonly ReportRow[], sortKey: string, sortDir: 'asc' | 'desc'): ReportRow[] {
  const result = rows.slice()
  if (sortKey) {
    const dir = sortDir === 'asc' ? 1 : -1
    result.sort((a, b) => {
      const av = readField(a, sortKey)
      const bv = readField(b, sortKey)
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
    return result
  }
  if (result.length > 0 && readField(result[0], 'date') != null) {
    result.sort((a, b) => String(readField(b, 'date') ?? '').localeCompare(String(readField(a, 'date') ?? '')))
  }
  return result
}

/** Reports — pick a report, set the filters, and export the result set. */
export function ReportsScreen() {
  const [view, setView] = useState<ReportId>('income')
  const [filters, setFilters] = useState<ReportFilterState>(() => buildDefaultFilters(REPORTS[0]))
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')

  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [],
  )

  const report = useMemo<ReportDefinition>(() => REPORTS.find((r) => r.id === view) ?? REPORTS[0], [view])

  const pulse = () => {
    setLoading(true)
    if (loadingTimer.current) clearTimeout(loadingTimer.current)
    loadingTimer.current = setTimeout(() => setLoading(false), 380)
  }

  const showToast = (message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }

  const handleSelectReport = (id: ReportId) => {
    const next = REPORTS.find((r) => r.id === id)
    if (!next) return
    setView(id)
    setFilters(buildDefaultFilters(next))
    setSortKey('')
    setSortDir('desc')
    setPage(0)
    pulse()
  }

  const handleReset = () => {
    setFilters(buildDefaultFilters(report))
    setPage(0)
    pulse()
  }

  const handleSort = (key: string) => {
    const nextDir = sortKey === key && sortDir === 'desc' ? 'asc' : 'desc'
    setSortKey(key)
    setSortDir(nextDir)
    setPage(0)
    pulse()
  }

  const groups: ReportGroup[] = useMemo(
    () =>
      REPORT_CATEGORIES.map((category) => ({
        category,
        reports: REPORTS.filter((r) => r.category === category),
      })).filter((group) => group.reports.length > 0),
    [],
  )

  const filteredRows = useMemo(() => applyFilters(report, DATASETS[report.id], filters), [report, filters])
  const sortedRows = useMemo(() => sortRows(filteredRows, sortKey, sortDir), [filteredRows, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = sortedRows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const totals = useMemo(() => {
    if (report.totals.length === 0 || filteredRows.length === 0) return undefined
    const sums: Record<string, number> = {}
    report.totals.forEach((key) => {
      sums[key] = filteredRows.reduce((sum, row) => sum + (Number(readField(row, key)) || 0), 0)
    })
    return sums
  }, [report, filteredRows])

  const resultLabel = `${formatCount(filteredRows.length)} ${filteredRows.length === 1 ? 'row' : 'rows'}`
  const showTable = !loading && filteredRows.length > 0
  const showEmpty = !loading && filteredRows.length === 0
  const emptyIcon = report.flagged ? 'plugs' : 'magnifying-glass'
  const emptyMessage = report.flagged
    ? 'No data yet — this report is pending its data source. The filters above show the intended shape.'
    : 'No rows match the current filters. Adjust the date range or filters.'

  const pageInfo =
    sortedRows.length > 0
      ? `Showing ${currentPage * PAGE_SIZE + 1}–${Math.min(sortedRows.length, (currentPage + 1) * PAGE_SIZE)} of ${formatCount(sortedRows.length)} rows`
      : ''
  const pageLabel = `Page ${currentPage + 1} of ${pageCount}`

  const handleExport = (kind: 'csv' | 'xls') => {
    const rows = sortedRows
    setExporting(true)
    window.setTimeout(() => {
      const head = report.columns.map((c) => c.label)
      const body = rows.map((row) =>
        report.columns.map((c) => {
          const value = readField(row, c.key)
          return value == null ? '' : String(value)
        }),
      )
      let blob: Blob
      let ext: string
      if (kind === 'csv') {
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
        const csv = [head.map(esc).join(','), ...body.map((r) => r.map(esc).join(','))].join('\n')
        blob = new Blob([csv], { type: 'text/csv' })
        ext = 'csv'
      } else {
        const tr = (cells: readonly string[], tag: string) =>
          `<tr>${cells.map((c) => `<${tag}>${c.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</${tag}>`).join('')}</tr>`
        const html = `<table>${tr(head, 'th')}${body.map((r) => tr(r, 'td')).join('')}</table>`
        blob = new Blob([html], { type: 'application/vnd.ms-excel' })
        ext = 'xls'
      }
      const anchor = document.createElement('a')
      anchor.href = URL.createObjectURL(blob)
      anchor.download = `${report.name.replace(/\s+/g, '-').toLowerCase()}.${ext}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(anchor.href), 4000)
      setExporting(false)
      showToast(`Exported ${formatCount(rows.length)} rows (${ext.toUpperCase()})`)
    }, 700)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex shrink-0 items-center gap-4 px-7 pt-5.5 pb-3">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Reports</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Pick a report, set the filters, and export the result set.</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-7 pt-0.5 pb-6">
        <ReportCatalogue groups={groups} selectedId={view} onSelect={handleSelectReport} />

        <ReportFilterBar
          hasDate={!report.noDate}
          filters={filters}
          extraFilters={report.filters}
          onPresetChange={(preset) => setFilters((prev) => ({ ...prev, preset }))}
          onFromChange={(from) => setFilters((prev) => ({ ...prev, from }))}
          onToChange={(to) => setFilters((prev) => ({ ...prev, to }))}
          onExtraChange={(key, value) => setFilters((prev) => ({ ...prev, extra: { ...prev.extra, [key]: value } }))}
          onReset={handleReset}
        />

        {report.flagged && report.pendingNote && <ReportPendingBanner note={report.pendingNote} />}

        <div className="flex min-h-80 shrink-0 flex-col gap-3.5">
          {loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-card py-16 text-ink-subtle shadow-sm">
              <Spinner size={28} />
              <span className="text-sm">Running report…</span>
            </div>
          )}

          {showTable && (
            <>
              <ReportExportPanel
                reportName={report.name}
                resultLabel={resultLabel}
                exportBusy={exporting}
                onExportCsv={() => handleExport('csv')}
                onExportXls={() => handleExport('xls')}
              />
              <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
                <ReportResultsTable
                  columns={report.columns}
                  rows={pageRows}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  totals={totals}
                  totalRowCount={filteredRows.length}
                />
              </div>
              <ReportPagination
                pageInfo={pageInfo}
                pageLabel={pageLabel}
                prevDisabled={currentPage <= 0}
                nextDisabled={currentPage >= pageCount - 1}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              />
            </>
          )}

          {showEmpty && (
            <div className="rounded-2xl bg-card shadow-sm">
              <ReportEmptyState
                icon={emptyIcon}
                message={emptyMessage}
                showClearFilters={!report.flagged}
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
