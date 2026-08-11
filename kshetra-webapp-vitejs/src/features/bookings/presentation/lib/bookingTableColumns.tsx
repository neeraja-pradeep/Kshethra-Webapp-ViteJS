import type { TableColumn } from '@/shared/ui'
import { Badge, Checkbox, Icon, Tooltip } from '@/shared/ui'
import type { Booking } from '@/features/bookings/domain/entities/booking'
import { primaryGodName } from '@/features/bookings/domain/entities/booking'
import { BookingSortHeader } from '@/features/bookings/presentation/components/BookingSortHeader'
import { BookingStatusBadge } from '@/features/bookings/presentation/components/BookingStatusBadge'
import { bookedByLabel, channelLabel, statusLabel, statusTone } from '@/features/bookings/presentation/lib/bookingDisplay'
import { formatFullDate } from '@/features/bookings/presentation/lib/date'

/** UI sort keys, mapped to the server's `?sort=` values in `SORT_PARAM`. */
export type BookingSortKey = 'poojaName' | 'poojaDate' | 'person' | 'poojari' | 'status'

/** The server rejects anything outside its own list, so the mapping is explicit. */
export const SORT_PARAM: Record<BookingSortKey, string> = {
  poojaName: 'pooja',
  poojaDate: 'pooja_date',
  person: 'person',
  poojari: 'poojari',
  status: 'booking_status',
}

export interface BookingColumnsOptions {
  sortKey: BookingSortKey | ''
  sortDir: 'asc' | 'desc'
  onSort: (key: BookingSortKey) => void
  allSelected: boolean
  someSelected: boolean
  onToggleSelectAll: () => void
  isSelected: (id: number) => boolean
  onToggleSelect: (id: number) => void
  /** Rows that cannot be acted on are not selectable — see `isCompletable`. */
  isSelectable: (booking: Booking) => boolean
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
      header: (
        <Checkbox
          checked={opts.allSelected}
          indeterminate={opts.someSelected}
          onChange={opts.onToggleSelectAll}
          aria-label="Select every actionable booking on this page"
        />
      ),
      render: (_value, row) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Checkbox
            checked={opts.isSelected(row.id)}
            disabled={!opts.isSelectable(row)}
            onChange={() => opts.onToggleSelect(row.id)}
            aria-label={`Select ${row.pooja.name} for ${row.person.name}`}
          />
        </span>
      ),
    },
    {
      key: 'poojaName',
      header: header('Pooja', 'poojaName'),
      sub: (row) => primaryGodName(row),
      render: (_value, row) => (
        <span className="inline-flex items-center gap-1.75">
          <span className="font-medium text-ink-strong">{row.pooja.name}</span>
          {row.pooja.special && (
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
      render: (_value, row) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink">
          {row.poojaDate ? formatFullDate(row.poojaDate) : <span className="text-ink-subtle">No date</span>}
          {row.isOverdue && (
            <Tooltip content="Past its completion window — reassign or mark it complete">
              <Badge color="red" size="sm">
                Overdue
              </Badge>
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      key: 'person',
      header: header('Person', 'person'),
      sub: (row) => row.person.nakshatram || '—',
      render: (_value, row) => <span className="font-medium text-ink-strong">{row.person.name || '—'}</span>,
    },
    {
      key: 'channel',
      header: 'Booked via',
      sub: (row) => bookedByLabel(row),
      render: (_value, row) => (
        <span className="inline-flex items-center gap-1.5 text-ink">
          <Icon name={row.channel === 'counter' ? 'storefront' : 'device-mobile'} size={14} color="var(--text-subtle)" />
          {channelLabel(row.channel)}
        </span>
      ),
    },
    {
      key: 'poojari',
      header: header('Poojari', 'poojari'),
      render: (_value, row) =>
        row.poojari ? (
          <span className="whitespace-nowrap text-ink">{row.poojari.name}</span>
        ) : (
          // Unassigned is a state the temple acts on, not missing data — the
          // feed can filter to exactly these, so it earns a visible label.
          <span className="whitespace-nowrap text-ink-subtle">Unassigned</span>
        ),
    },
    {
      key: 'status',
      header: header('Booking status', 'status'),
      render: (_value, row) => <BookingStatusBadge label={statusLabel(row.status)} tone={statusTone(row.status)} />,
    },
    {
      key: 'orderReference',
      header: 'Order ref',
      render: (_value, row) => (
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-primary">
          {row.orderReference}
          <Icon name="arrow-up-right" size={12} />
        </span>
      ),
    },
  ]
}
