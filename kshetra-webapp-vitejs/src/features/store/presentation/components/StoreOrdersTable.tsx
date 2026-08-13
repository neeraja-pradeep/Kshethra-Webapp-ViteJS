import type { ReactNode } from 'react'

import { formatINR } from '@/shared/lib/format'
import { formatOrderDateTime } from '@/shared/lib/format'
import { Badge, Icon, Table, type BadgeColor, type TableColumn } from '@/shared/ui'
import { orderPaymentStatusLabel, type OrderListRow } from '@/shared/order-feed/domain/order-feed'
import { paymentStatusColor } from '@/shared/order-feed/presentation/paymentStatus'

import { fulfilmentLabel, type FulfilmentStatus } from '@/features/store/domain/entities/store-order'

export interface StoreOrdersTableProps {
  rows: readonly OrderListRow[]
  onOpenOrder: (orderId: number) => void
  empty: ReactNode
}

/** The feed reports the stored fulfilment status in `status` for a shop order. */
function fulfilmentColor(status: string): BadgeColor {
  switch (status) {
    case 'delivered':
      return 'green'
    case 'shipped':
      return 'blue'
    case 'packed':
    case 'processing':
      return 'amber'
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
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
 * One row per shop order.
 *
 * No sortable headers: the feed's ordering is fixed at newest first, and the
 * two source tables are unioned and paged in the database — a client-side sort
 * would only reorder the page in hand.
 */
export function StoreOrdersTable({ rows, onOpenOrder, empty }: StoreOrdersTableProps) {
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
      header: 'Customer',
      render: (_v, row) => (
        <TwoLine
          top={<span className="font-medium text-ink-strong">{row.customer?.name || 'Walk-in'}</span>}
          bottom={row.customer?.phone}
        />
      ),
    },
    {
      key: 'channel',
      header: 'Booked via',
      // On a walk-in `customer` is the buyer, so the second line names the
      // staff member who rang it up rather than attributing it to them.
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
            Online
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
      header: 'Items',
      align: 'right',
      // Units bought, then how many different variants they are.
      render: (_v, row) => (
        <div className="flex flex-col items-end gap-0.5 py-px">
          <span className="tabular-nums">{row.itemCount}</span>
          {row.distinctItemCount !== row.itemCount && (
            <span className="text-xs text-ink-subtle">
              {row.distinctItemCount} {row.distinctItemCount === 1 ? 'product' : 'products'}
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
      header: 'Payment',
      render: (_v, row) => (
        <TwoLine
          top={
            <Badge color={paymentStatusColor(row.paymentStatus)}>
              {orderPaymentStatusLabel(row.paymentStatus)}
            </Badge>
          }
          bottom={row.paymentMethod}
        />
      ),
    },
    {
      key: 'status',
      header: 'Fulfilment',
      render: (_v, row) => (
        <Badge color={fulfilmentColor(row.status)}>
          {fulfilmentLabel(row.status as FulfilmentStatus) ?? row.status}
        </Badge>
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
