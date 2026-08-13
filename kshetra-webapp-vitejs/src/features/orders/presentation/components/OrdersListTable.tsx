import type { ReactNode } from 'react'

import { Badge, Icon, Table, type TableColumn } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

import { orderPaymentStatusLabel, type OrderListRow } from '@/shared/order-feed/domain/order-feed'
import { formatOrderDateTime } from '@/shared/lib/format'
import { poojaStatusColor, poojaStatusLabel } from '@/features/orders/presentation/lib/orderStatus'
import { paymentStatusColor } from '@/shared/order-feed/presentation/paymentStatus'

export interface OrdersListTableProps {
  rows: readonly OrderListRow[]
  onOpenOrder: (orderId: number) => void
  empty: ReactNode
}

function TwoLine({ top, bottom }: { top: ReactNode; bottom?: ReactNode | null }) {
  return (
    <div className="flex flex-col items-start gap-0.5 py-px">
      {top}
      {bottom != null && bottom !== '' && <span className="text-xs text-ink-subtle">{bottom}</span>}
    </div>
  )
}

/**
 * One row per order. There are no sortable headers: the feed's ordering is
 * fixed at newest first and the two source tables are unioned and paged in the
 * database, so a client-side sort would only reorder the page in hand.
 */
export function OrdersListTable({ rows, onOpenOrder, empty }: OrdersListTableProps) {
  const columns: TableColumn<OrderListRow>[] = [
    {
      key: 'reference',
      header: 'Order ref',
      render: (_v, row) => (
        <button
          type="button"
          title="Open order detail"
          onClick={(e) => {
            e.stopPropagation()
            onOpenOrder(row.id)
          }}
          className="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 font-sans text-sm font-medium text-primary"
        >
          {row.reference}
          <Icon name="arrow-up-right" size={12} />
        </button>
      ),
    },
    {
      key: 'customer',
      header: 'Devotee',
      render: (_v, row) => (
        <TwoLine
          top={<span className="font-medium text-ink-strong">{row.customer?.name || '—'}</span>}
          bottom={row.agentCode ? `Agent code · ${row.agentCode.name}` : row.customer?.phone}
        />
      ),
    },
    {
      key: 'channel',
      header: 'Booked via',
      // On a counter sale `customer` is the walk-in payer, so the second line
      // names the staff member who rang it up — reading the order's user there
      // would attribute the sale to whoever was on the desk.
      render: (_v, row) =>
        row.channel === 'counter' ? (
          <TwoLine
            top={
              <span className="inline-flex items-center gap-1.5 text-ink">
                <Icon name="storefront" size={14} className="text-ink-subtle" />
                Counter
              </span>
            }
            bottom={row.counter?.staffName || row.counter?.receiptNo}
          />
        ) : (
          <span className="inline-flex items-center gap-1.5 text-ink">
            <Icon name="device-mobile" size={14} className="text-ink-subtle" />
            Mobile app
          </span>
        ),
    },
    {
      key: 'created_at',
      header: 'Order date',
      render: (_v, row) => <span className="whitespace-nowrap">{formatOrderDateTime(row.createdAt)}</span>,
    },
    {
      key: 'item_count',
      header: 'Poojas',
      align: 'right',
      // Occurrences, then how many distinct poojas they are: one pooja for a
      // family of four reads "4" over "1 pooja", not "4 poojas".
      render: (_v, row) => (
        <div className="flex flex-col items-end gap-0.5 py-px">
          <span className="tabular-nums">{row.itemCount}</span>
          {row.distinctItemCount !== row.itemCount && (
            <span className="text-xs text-ink-subtle">
              {row.distinctItemCount} {row.distinctItemCount === 1 ? 'pooja' : 'poojas'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (_v, row) => (
        <div className="flex flex-col items-end gap-0.5 py-px">
          <span className="font-medium tabular-nums">{formatINR(row.total)}</span>
          {row.refundAmount > 0 && (
            <span className="text-xs text-ink-subtle">−{formatINR(row.refundAmount)} refunded</span>
          )}
        </div>
      ),
    },
    {
      key: 'payment_status',
      header: 'Payment status',
      render: (_v, row) => (
        <TwoLine
          top={<Badge color={paymentStatusColor(row.paymentStatus)}>{orderPaymentStatusLabel(row.paymentStatus)}</Badge>}
          bottom={row.paymentMethod}
        />
      ),
    },
    {
      key: 'pooja_status',
      header: 'Pooja status',
      render: (_v, row) =>
        row.poojaStatus ? (
          <Badge color={poojaStatusColor(row.poojaStatus)}>{poojaStatusLabel(row.poojaStatus)}</Badge>
        ) : (
          <span className="text-ink-subtle">—</span>
        ),
    },
  ]

  return (
    <Table
      columns={columns}
      rows={rows as OrderListRow[]}
      onRowClick={(row) => onOpenOrder(row.id)}
      empty={empty}
    />
  )
}
