import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export interface TableColumn<T> {
  key: string
  header: ReactNode
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T) => ReactNode
  sub?: (row: T) => ReactNode
}

export interface TableProps<T extends { id: string | number }> {
  columns: TableColumn<T>[]
  rows: readonly T[]
  onRowClick?: (row: T) => void
  selectedId?: string | number | null
  empty?: ReactNode
  className?: string
  style?: CSSProperties
  /**
   * Extra attributes for a row — drag handlers, `aria-grabbed`, and the like.
   * Any `className` returned here is appended to the row's own, so a caller can
   * tint a drop target without restyling the table.
   */
  rowProps?: (row: T, index: number) => HTMLAttributes<HTMLTableRowElement>
}

/** Borderless, airy data table with sticky headers + tabular figures. */
export function Table<T extends { id: string | number }>({
  columns,
  rows,
  onRowClick,
  selectedId,
  empty = 'No records',
  className,
  style,
  rowProps,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto font-sans', className)} style={style}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="sticky top-0 z-[2] whitespace-nowrap border-b border-stroke-subtle bg-card px-3.5 py-2.5 text-2xs font-semibold uppercase tracking-header text-ink-table"
                style={{ textAlign: c.align ?? 'left', width: c.width }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3.5 py-7 text-center text-ink-subtle">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const selected = selectedId != null && row.id === selectedId
              const last = i === rows.length - 1
              const { className: rowClassName, ...extraRowProps } = rowProps?.(row, i) ?? {}
              return (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  {...extraRowProps}
                  className={cn(
                    'transition-[background] duration-120 ease-ks',
                    onRowClick ? 'cursor-pointer' : 'cursor-default',
                    selected ? 'bg-primary-subtle' : onRowClick && 'hover:bg-hover',
                    rowClassName,
                  )}
                >
                  {columns.map((c) => {
                    const subVal = c.sub ? c.sub(row) : null
                    return (
                      <td
                        key={c.key}
                        className={cn(
                          'whitespace-nowrap px-3.5 py-2.75 align-top text-ink',
                          !last && 'border-b border-gray-100',
                        )}
                        style={{ textAlign: c.align ?? 'left' }}
                      >
                        {c.render
                          ? c.render((row as Record<string, unknown>)[c.key], row)
                          : ((row as Record<string, unknown>)[c.key] as ReactNode)}
                        {subVal != null && (
                          <div className="mt-0.75 whitespace-nowrap text-2xs font-medium text-ink-subtle">
                            {subVal}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
