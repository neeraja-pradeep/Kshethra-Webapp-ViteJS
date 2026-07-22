import type { TableColumn } from '@/shared/ui'
import { Badge, Checkbox, Icon } from '@/shared/ui'
import type { Booking } from '@/features/bookings/domain/entities/booking'
import { BookingSortHeader } from '@/features/bookings/presentation/components/BookingSortHeader'
import { BookingStatusBadge } from '@/features/bookings/presentation/components/BookingStatusBadge'
import { formatFullDate } from '@/features/bookings/presentation/lib/date'

export type BookingSortKey = 'poojaName' | 'poojaDate' | 'person' | 'poojari' | 'status'

export interface BookingColumnsOptions {
  sortKey: BookingSortKey | ''
  sortDir: 'asc' | 'desc'
  onSort: (key: BookingSortKey) => void
  allSelected: boolean
  someSelected: boolean
  onToggleSelectAll: () => void
  isSelected: (id: string) => boolean
  onToggleSelect: (id: string) => void
}

/** Column set for the bookings table — two-line cells, sortable headers, status pill. */
export function buildBookingColumns(opts: BookingColumnsOptions): TableColumn<Booking>[] {
  const header = (label: string, key: BookingSortKey) => (
    <BookingSortHeader label={label} sortKey={key} activeSortKey={opts.sortKey} sortDir={opts.sortDir} onSort={opts.onSort} />
  )

  return [
    {
      key: 'sel',
      width: 44,
      header: <Checkbox checked={opts.allSelected} indeterminate={opts.someSelected} onChange={opts.onToggleSelectAll} />,
      render: (_value, row) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Checkbox checked={opts.isSelected(row.id)} onChange={() => opts.onToggleSelect(row.id)} />
        </span>
      ),
    },
    {
      key: 'poojaName',
      header: header('Pooja', 'poojaName'),
      sub: (row) => row.godName,
      render: (_value, row) => (
        <span className="inline-flex items-center gap-1.75">
          <span className="font-medium text-ink-strong">{row.poojaName}</span>
          {row.special && (
            <Badge color="maroon" size="sm">
              Special
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: 'poojaDate',
      header: header('Pooja date', 'poojaDate'),
      render: (_value, row) => <span className="whitespace-nowrap text-ink">{formatFullDate(row.poojaDate)}</span>,
    },
    {
      key: 'person',
      header: header('Person', 'person'),
      sub: (row) => row.nakshatra || '—',
      render: (_value, row) => <span className="font-medium text-ink-strong">{row.person || '—'}</span>,
    },
    {
      key: 'channel',
      header: 'Booked via',
      sub: (row) => (row.channel === 'Counter' ? row.counterStaff : row.devoteeAccountName),
      render: (_value, row) => (
        <span className="inline-flex items-center gap-1.5 text-ink">
          <Icon name={row.channel === 'Counter' ? 'storefront' : 'device-mobile'} size={14} color="var(--text-subtle)" />
          {row.channel}
        </span>
      ),
    },
    {
      key: 'poojari',
      header: header('Poojari', 'poojari'),
      render: (_value, row) => <span className="whitespace-nowrap text-ink">{row.poojari}</span>,
    },
    {
      key: 'status',
      header: header('Booking status', 'status'),
      render: (_value, row) => <BookingStatusBadge label={row.status} tone={row.statusTone} />,
    },
    {
      key: 'orderRef',
      header: 'Order ref',
      render: (_value, row) => (
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-primary">
          {row.orderRef}
          <Icon name="arrow-up-right" size={12} />
        </span>
      ),
    },
  ]
}
