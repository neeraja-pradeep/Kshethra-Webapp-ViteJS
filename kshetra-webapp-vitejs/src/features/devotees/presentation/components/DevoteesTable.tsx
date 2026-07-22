import type { ReactNode } from 'react'

import { Badge, Table } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'

import type { Devotee } from '@/features/devotees/domain/entities/devotee'
import { devoteeStatusColor } from '@/features/devotees/presentation/lib/badgeColors'
import type { DevoteeSortKey, SortDirection } from '@/features/devotees/presentation/lib/filterSort'
import { formatDisplayDate } from '@/features/devotees/presentation/lib/formatDate'

import { SortableHeader } from './SortableHeader'

export interface DevoteesTableProps {
  rows: readonly Devotee[]
  sortKey: DevoteeSortKey | ''
  sortDir: SortDirection
  onSort: (key: DevoteeSortKey) => void
  onRowClick: (row: Devotee) => void
  empty: ReactNode
}

/** Devotees list table: two-line account-holder cell, right-aligned counts, sortable headers. */
export function DevoteesTable({ rows, sortKey, sortDir, onSort, onRowClick, empty }: DevoteesTableProps) {
  const header = (label: string, key: DevoteeSortKey) => (
    <SortableHeader label={label} sortKey={key} activeKey={sortKey} direction={sortDir} onSort={onSort} />
  )

  const columns: TableColumn<Devotee>[] = [
    {
      key: 'name',
      header: header('Account holder', 'name'),
      render: (_value, row) => (
        <div className="flex flex-col gap-0.5 py-px">
          <span className="font-medium text-ink-strong">{row.name}</span>
          <span className="text-xs text-ink-subtle">{row.phone}</span>
        </div>
      ),
    },
    {
      key: 'family',
      header: header('Family', 'family'),
      align: 'right',
      render: (_value, row) => <span className="tabular-nums text-ink">{row.family.length}</span>,
    },
    {
      key: 'bookings',
      header: header('Bookings', 'bookings'),
      align: 'right',
      render: (_value, row) => <span className="tabular-nums text-ink">{row.bookings.length}</span>,
    },
    {
      key: 'lastActivity',
      header: header('Last activity', 'last'),
      render: (_value, row) => <span className="whitespace-nowrap text-ink-muted">{formatDisplayDate(row.lastActivity)}</span>,
    },
    {
      key: 'status',
      header: header('Status', 'status'),
      render: (_value, row) => (
        <Badge color={devoteeStatusColor(row.status)} size="sm">
          {row.status}
        </Badge>
      ),
    },
  ]

  return <Table columns={columns} rows={[...rows]} onRowClick={onRowClick} empty={empty} />
}
