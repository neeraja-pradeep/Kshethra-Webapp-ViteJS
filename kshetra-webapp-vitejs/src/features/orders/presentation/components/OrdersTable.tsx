import type { ReactNode } from 'react'

import { Badge, Icon, Table, type TableColumn } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'
import type { OrderRow } from '@/features/orders/presentation/lib/orderRow'
import { formatOrderDate } from '@/features/orders/presentation/lib/format'
import { bookingStatusColor, paymentStatusColor } from '@/features/orders/presentation/lib/statusColors'
import type { OrderSortDir, OrderSortKey } from '@/features/orders/presentation/lib/orderFilters'
import { OrdersSortableHeader } from '@/features/orders/presentation/components/OrdersSortableHeader'

export interface OrdersTableProps {
  rows: readonly OrderRow[]
  sortKey: OrderSortKey | ''
  sortDir: OrderSortDir
  onSort: (key: OrderSortKey) => void
  onOpenOrder: (ref: string) => void
  empty: ReactNode
}

function TwoLine({ top, bottom }: { top: ReactNode; bottom?: ReactNode | null }) {
  return (
    <div className="flex flex-col items-start gap-0.5 py-px">
      {top}
      {bottom != null && <span className="text-xs text-ink-subtle">{bottom}</span>}
    </div>
  )
}

/** The Pooja Orders table: two-line devotee / booked-via cells, sortable columns, status badges. */
export function OrdersTable({ rows, sortKey, sortDir, onSort, onOpenOrder, empty }: OrdersTableProps) {
  const header = (label: string, key: OrderSortKey) => (
    <OrdersSortableHeader label={label} sortKey={key} activeSortKey={sortKey} sortDir={sortDir} onSort={onSort} />
  )

  const columns: TableColumn<OrderRow>[] = [
    {
      key: 'ref',
      header: header('Order ref', 'ref'),
      render: (_v, row) => (
        <button
          type="button"
          title="Open order detail"
          onClick={(e) => {
            e.stopPropagation()
            onOpenOrder(row.ref)
          }}
          className="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 font-sans text-sm font-medium text-primary"
        >
          {row.ref}
          <Icon name="arrow-up-right" size={12} />
        </button>
      ),
    },
    {
      key: 'devoteeName',
      header: header('Devotee', 'devoteeName'),
      render: (_v, row) =>
        row.agentCode ? (
          <TwoLine top={<span className="font-medium text-ink-strong">{row.devoteeName || '—'}</span>} bottom={`Agent code · ${row.agentCode}`} />
        ) : (
          <span className="font-medium text-ink-strong">{row.devoteeName || '—'}</span>
        ),
    },
    {
      key: 'channel',
      header: 'Booked via',
      render: (_v, row) =>
        row.channel === 'Counter' ? (
          <TwoLine
            top={
              <span className="inline-flex items-center gap-1.5 text-ink">
                <Icon name="storefront" size={14} className="text-ink-subtle" />
                Counter
              </span>
            }
            bottom={row.counterStaff}
          />
        ) : (
          <TwoLine
            top={
              <span className="inline-flex items-center gap-1.5 text-ink">
                <Icon name="device-mobile" size={14} className="text-ink-subtle" />
                Mobile app
              </span>
            }
            bottom={row.devoteeName}
          />
        ),
    },
    { key: 'date', header: header('Order date', 'date'), render: (_v, row) => formatOrderDate(row.date) },
    { key: 'poojaCount', header: header('Poojas', 'poojaCount'), align: 'right', render: (_v, row) => <span className="tabular-nums">{row.poojaCount}</span> },
    {
      key: 'total',
      header: header('Total', 'total'),
      align: 'right',
      render: (_v, row) => <span className="font-medium tabular-nums">{formatINR(row.total)}</span>,
    },
    {
      key: 'paymentStatus',
      header: header('Payment status', 'paymentStatus'),
      render: (_v, row) => (
        <TwoLine top={<Badge color={paymentStatusColor(row.paymentStatus)}>{row.paymentStatus}</Badge>} bottom={row.paymentMethod} />
      ),
    },
    {
      key: 'bookingStatus',
      header: header('Booking status', 'bookingStatus'),
      render: (_v, row) => <Badge color={bookingStatusColor(row.bookingStatus)}>{row.bookingStatus}</Badge>,
    },
  ]

  return <Table columns={columns} rows={rows as OrderRow[]} onRowClick={(row) => onOpenOrder(row.ref)} empty={empty} />
}
