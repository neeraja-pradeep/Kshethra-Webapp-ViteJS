import { formatINR } from '@/shared/lib/format'

import type { ReportColumn, ReportRow } from '@/features/reports/domain/entities/report'

/**
 * Rendering one cell, driven by its column's `type`.
 *
 * The server describes every column rather than the client knowing any report's
 * shape, so this is the only place a value's type is interpreted — and the one
 * place a new column type has to be taught about.
 */

/** Money arrives as a **string** so no decimal is lost to a float in transit. */
export function formatMoneyValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const asNumber = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(asNumber) ? formatINR(asNumber) : String(value)
}

function formatDate(value: unknown, withTime: boolean): string {
  if (typeof value !== 'string' || !value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const date = parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  if (!withTime) return date
  return `${date}, ${parsed.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
}

/** The display string for a cell. `list` joins; `status` is chipped by the table. */
export function formatCellValue(value: unknown, column: ReportColumn): string {
  if (value === null || value === undefined || value === '') return '—'
  switch (column.type) {
    case 'money':
      return formatMoneyValue(value)
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('en-IN') : String(value)
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'date':
      return formatDate(value, false)
    case 'datetime':
      return formatDate(value, true)
    case 'list':
      return Array.isArray(value) ? (value.length ? value.join(', ') : '—') : String(value)
    default:
      return String(value)
  }
}

export function cellValue(row: ReportRow, column: ReportColumn): unknown {
  return row[column.key]
}

/** Tailwind text alignment for a column, as the server aligned it. */
export function alignClass(align: ReportColumn['align']): string {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

/**
 * Splits the server's `sort` into a column key and a direction.
 * `-created_at` means created_at, descending.
 */
export function parseSort(sort: string): { key: string; dir: 'asc' | 'desc' } {
  return sort.startsWith('-') ? { key: sort.slice(1), dir: 'desc' } : { key: sort, dir: 'asc' }
}

/** Clicking a sorted column flips it; clicking a new one starts ascending. */
export function nextSort(current: string, key: string): string {
  const parsed = parseSort(current)
  if (parsed.key !== key) return key
  return parsed.dir === 'asc' ? `-${key}` : key
}
