import type { ReactNode } from 'react'

import { formatINR } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { Badge, Icon, type TableColumn } from '@/shared/ui'

import type { FulfilmentStage, PaymentState } from '@/features/store/domain/entities/order'
import { fulfilmentBadgeColor, paymentBadgeColor } from '@/features/store/presentation/lib/storeFormat'

export interface OrderRow {
  id: string
  ref: string
  isWalkIn: boolean
  customerName: string
  contact: string
  dateLabel: string
  quantity: number
  total: number
  paymentStatus: PaymentState
  paymentMethod: string
  fulfilmentStatus: FulfilmentStage
}

export type OrderSortKey = 'ref' | 'customer' | 'date' | 'qty' | 'total' | 'pay' | 'fulfil'
export type SortDir = 'asc' | 'desc'

function sortableHeader(label: string, key: OrderSortKey, sortKey: OrderSortKey | null, sortDir: SortDir, onSort: (key: OrderSortKey) => void): ReactNode {
  const active = sortKey === key
  return (
    <span
      role="button"
      tabIndex={0}
      title={`Sort by ${label}`}
      onClick={() => onSort(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort(key)
        }
      }}
      className="inline-flex cursor-pointer select-none items-center gap-1"
    >
      {label}
      <Icon name={active ? (sortDir === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'} size={11} className={active ? 'opacity-90' : 'opacity-30'} />
    </span>
  )
}

/** Column set for the orders table — two-line customer/payment cells, right-aligned numerics. */
export function buildOrderColumns(sortKey: OrderSortKey | null, sortDir: SortDir, onSort: (key: OrderSortKey) => void): TableColumn<OrderRow>[] {
  return [
    {
      key: 'ref',
      header: sortableHeader('Order ref', 'ref', sortKey, sortDir, onSort),
      render: (v) => <span className="font-semibold text-ink-strong">{v as string}</span>,
    },
    {
      key: 'customerName',
      header: sortableHeader('Customer', 'customer', sortKey, sortDir, onSort),
      render: (_v, row) => (
        <div className="flex flex-col gap-0.5 py-px">
          <span className={cn('inline-flex items-center gap-1.5 font-medium', row.isWalkIn ? 'text-ink-muted' : 'text-ink-strong')}>
            {row.isWalkIn && <Icon name="storefront" size={14} />}
            {row.customerName}
          </span>
          <span className="text-xs text-ink-subtle">{row.contact}</span>
        </div>
      ),
    },
    {
      key: 'dateLabel',
      header: sortableHeader('Date', 'date', sortKey, sortDir, onSort),
      render: (v) => <span className="whitespace-nowrap text-ink-muted">{v as string}</span>,
    },
    {
      key: 'quantity',
      header: sortableHeader('Items', 'qty', sortKey, sortDir, onSort),
      align: 'right',
      render: (v) => <span className="tabular-nums text-ink">{v as number}</span>,
    },
    {
      key: 'total',
      header: sortableHeader('Total', 'total', sortKey, sortDir, onSort),
      align: 'right',
      render: (v) => <span className="tabular-nums font-semibold text-ink-strong">{formatINR(v as number)}</span>,
    },
    {
      key: 'paymentStatus',
      header: sortableHeader('Payment', 'pay', sortKey, sortDir, onSort),
      render: (v, row) => (
        <div className="flex flex-col gap-0.5 py-px">
          <Badge size="sm" color={paymentBadgeColor(v as PaymentState)}>
            {v as string}
          </Badge>
          <span className="text-xs text-ink-subtle">{row.paymentMethod}</span>
        </div>
      ),
    },
    {
      key: 'fulfilmentStatus',
      header: sortableHeader('Fulfilment', 'fulfil', sortKey, sortDir, onSort),
      render: (v) => (
        <Badge size="sm" color={fulfilmentBadgeColor(v as FulfilmentStage)}>
          {v as string}
        </Badge>
      ),
    },
  ]
}
