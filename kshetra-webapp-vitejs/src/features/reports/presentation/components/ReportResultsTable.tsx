import { Badge, Icon, Table } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatCount } from '@/shared/lib/format'

import type { ReportColumn, ReportRow } from '@/features/reports/domain/entities/report'
import {
  alignClass,
  cellValue,
  formatCellValue,
  formatMoneyValue,
  parseSort,
} from '@/features/reports/presentation/lib/reportCells'

export interface ReportResultsTableProps {
  columns: readonly ReportColumn[]
  rows: readonly ReportRow[]
  /** The sort the server applied, `-` prefixed for descending. */
  sort: string
  onSort: (key: string) => void
  /** A figure per `total: true` column, plus `rows`. Over the whole filtered set. */
  totals: Readonly<Record<string, unknown>>
  /** `totals.rows` — the whole filtered count, not this page's length. */
  totalRowCount: number
  loading?: boolean
}

/**
 * The rows are the server's, keyed by column key, so they carry no id of their
 * own. The index is a stable key **within one rendered page**, which is all
 * React needs here — nothing selects or reorders a report row.
 */
interface IndexedRow {
  readonly id: number
  readonly row: ReportRow | null
}

const TOTALS_ID = -1

/**
 * The active report's table.
 *
 * Every column is drawn from its definition — its label, alignment, whether it
 * sorts and how its values render. Nothing about any particular report is
 * known here, which is what lets a report added server-side appear with no
 * frontend release.
 */
export function ReportResultsTable({
  columns,
  rows,
  sort,
  onSort,
  totals,
  totalRowCount,
  loading = false,
}: ReportResultsTableProps) {
  const sorted = parseSort(sort)
  const hasTotals = rows.length > 0 && columns.some((c) => c.total)

  const tableColumns: TableColumn<IndexedRow>[] = columns.map((column, index) => ({
    key: column.key,
    align: column.align,
    header: column.sortable ? (
      <button
        type="button"
        onClick={() => onSort(column.key)}
        title={column.helpText ?? undefined}
        className={cn(
          'inline-flex items-center gap-1 border-none bg-transparent p-0 font-sans uppercase tracking-header text-inherit',
          column.align === 'right' && 'flex-row-reverse',
        )}
      >
        {column.label}
        <Icon
          name={sorted.key === column.key ? (sorted.dir === 'asc' ? 'caret-up' : 'caret-down') : 'caret-up-down'}
          weight={sorted.key === column.key ? 'fill' : 'regular'}
          size={11}
        />
      </button>
    ) : (
      /* A `list` column has no single value to order by, so it does not sort. */
      <span title={column.helpText ?? undefined} className="uppercase tracking-header">
        {column.label}
      </span>
    ),
    render: (_value, indexed) => {
      if (indexed.row === null) {
        if (index === 0) {
          return <span className="font-semibold text-ink-strong">{`Total · ${formatCount(totalRowCount)} rows`}</span>
        }
        if (!column.total) return null
        const sum = totals[column.key]
        if (sum === undefined) return null
        return (
          <span className="font-semibold tabular-nums text-ink-strong">
            {column.type === 'money' ? formatMoneyValue(sum) : formatCellValue(sum, column)}
          </span>
        )
      }

      const value = cellValue(indexed.row, column)

      if (column.type === 'status' && value !== null && value !== undefined && value !== '') {
        return <Badge color="blue">{String(value)}</Badge>
      }

      return (
        <span
          className={cn(
            alignClass(column.align),
            column.type === 'money' || column.type === 'number' ? 'tabular-nums' : '',
            column.type === 'money' ? 'font-medium text-ink-strong' : 'text-ink',
          )}
        >
          {formatCellValue(value, column)}
        </span>
      )
    },
  }))

  const tableRows: IndexedRow[] = rows.map((row, i) => ({ id: i, row }))
  if (hasTotals) tableRows.push({ id: TOTALS_ID, row: null })

  return (
    <div className={cn(loading && 'opacity-60 transition-opacity duration-140 ease-ks')}>
      <Table<IndexedRow> columns={tableColumns} rows={tableRows} empty="No rows match the current filters." />
    </div>
  )
}
