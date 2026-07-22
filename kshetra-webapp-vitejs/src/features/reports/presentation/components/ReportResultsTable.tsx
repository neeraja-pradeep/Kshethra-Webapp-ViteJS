import { Icon, Table } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatCount, formatINR } from '@/shared/lib/format'

import type { MonthlyPrev, ReportColumn, ReportRow } from '@/features/reports/domain/entities/report'

export interface ReportResultsTableProps {
  columns: readonly ReportColumn[]
  rows: readonly ReportRow[]
  sortKey: string
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
  /** Sums for each totalled column, keyed by column key — omitted when the report has no totals. */
  totals?: Readonly<Record<string, number>>
  totalRowCount: number
}

type CellPrimitive = string | number

interface TotalsRowShape {
  readonly id: '__totals__'
  readonly kind: 'totals'
}

type TableRow = ReportRow | TotalsRowShape

function isTotalsRow(row: TableRow): row is TotalsRowShape {
  return 'kind' in row && row.kind === 'totals'
}

function getField(row: ReportRow, key: string): CellPrimitive | null {
  const record = row as unknown as Record<string, CellPrimitive | MonthlyPrev | null | undefined>
  const value = record[key]
  if (value == null || typeof value === 'object') return null
  return value
}

function getPrev(row: ReportRow): MonthlyPrev | null {
  const record = row as unknown as { prev?: MonthlyPrev | null }
  return record.prev ?? null
}

/** `2026-07-15` → `15 Jul 2026`, matching the design's date formatting. */
function formatDateEnIN(iso: string): string {
  const parts = iso.split('-')
  if (parts.length < 3) return iso
  const [year, month, day] = parts.map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCellText(column: ReportColumn, value: CellPrimitive | null): string {
  if (value == null) return '—'
  if (column.money) return formatINR(value)
  if (column.key === 'date') return formatDateEnIN(String(value))
  if (column.num && typeof value === 'number') return formatCount(value)
  return String(value)
}

function deltaSuffix(column: ReportColumn, row: ReportRow): string {
  if (!column.delta) return ''
  const prev = getPrev(row)
  if (!prev) return ''
  const current = getField(row, column.key)
  const prevValue = (prev as unknown as Record<string, number>)[column.key]
  if (typeof current !== 'number' || typeof prevValue !== 'number' || current === prevValue) return ''
  return current > prevValue ? ' ▲' : ' ▼'
}

function cellColorClass(column: ReportColumn, row: ReportRow): string {
  if (column.delta) {
    const prev = getPrev(row)
    if (prev) {
      const current = getField(row, column.key)
      const prevValue = (prev as unknown as Record<string, number>)[column.key]
      if (typeof current === 'number' && typeof prevValue === 'number') {
        if (current < prevValue) return 'text-danger'
        if (current > prevValue) return 'text-success'
      }
    }
  }
  if (column.key === 'flag') {
    const value = getField(row, column.key)
    if (value === 'Out of stock') return 'text-danger'
    if (value === 'Low stock') return 'text-warning'
  }
  return 'text-ink'
}

/** Result table for the active report — sortable headers, coloured deltas/flags, and a totals row. */
export function ReportResultsTable({ columns, rows, sortKey, sortDir, onSort, totals, totalRowCount }: ReportResultsTableProps) {
  const hasTotals = !!totals && rows.length > 0

  const tableColumns: TableColumn<TableRow>[] = columns.map((column, index) => {
    const align: 'left' | 'right' = column.money || column.num ? 'right' : 'left'
    const sortIcon = sortKey === column.key ? (sortDir === 'asc' ? 'caret-up' : 'caret-down') : 'caret-up-down'
    return {
      key: column.key,
      align,
      header: (
        <button
          type="button"
          onClick={() => onSort(column.key)}
          className={cn('inline-flex items-center gap-1 uppercase tracking-header', align === 'right' && 'flex-row-reverse')}
        >
          {column.label}
          <Icon name={sortIcon} weight={sortKey === column.key ? 'fill' : 'regular'} size={11} />
        </button>
      ),
      render: (_value, row) => {
        if (isTotalsRow(row)) {
          if (index === 0) return <span className="font-semibold text-ink-strong">{`Total · ${formatCount(totalRowCount)} rows`}</span>
          if (!totals || !(column.key in totals)) return null
          const sum = totals[column.key]
          return (
            <span className="font-semibold tabular-nums text-ink-strong">{column.money ? formatINR(sum) : formatCount(sum)}</span>
          )
        }
        return (
          <span className={cn('tabular-nums', column.money || column.key === 'flag' ? 'font-medium' : 'font-normal', cellColorClass(column, row))}>
            {formatCellText(column, getField(row, column.key))}
            {deltaSuffix(column, row)}
          </span>
        )
      },
    }
  })

  const tableRows: TableRow[] = hasTotals ? [...rows, { id: '__totals__', kind: 'totals' }] : [...rows]

  return (
    <Table<TableRow>
      columns={tableColumns}
      rows={tableRows}
      empty="No rows match the current filters."
    />
  )
}
