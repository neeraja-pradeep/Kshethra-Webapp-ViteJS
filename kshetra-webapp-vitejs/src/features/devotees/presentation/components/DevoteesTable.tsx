import type { ReactNode } from 'react'

import { Badge, Table } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'

import { DEVOTEE_STATUS_LABEL, type Devotee } from '@/features/devotees/domain/entities/devotee'
import { devoteeStatusColor } from '@/features/devotees/presentation/lib/badgeColors'
import { formatDisplayDate } from '@/features/devotees/presentation/lib/formatDate'
import type { DevoteeSortKey, SortDirection } from '@/features/devotees/presentation/lib/sort'

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
          {/* Sign-up does not require a name; the server falls back to the username. */}
          <span className="font-medium text-ink-strong">{row.name}</span>
          <span className="text-xs text-ink-subtle">{row.phone ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'family',
      header: header('Family', 'family'),
      align: 'right',
      // The account holder's own profile is included, so 1 is the smallest
      // value on a devotee who has ever opened the family screen.
      render: (_value, row) => <span className="tabular-nums text-ink">{row.familyCount}</span>,
    },
    {
      key: 'bookings',
      header: header('Bookings', 'bookings'),
      align: 'right',
      // Cancelled and refunded dates are left out — see the detail's caption.
      render: (_value, row) => <span className="tabular-nums text-ink">{row.bookingCount}</span>,
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
          {DEVOTEE_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
  ]

  return <Table columns={columns} rows={[...rows]} onRowClick={onRowClick} empty={empty} />
}
