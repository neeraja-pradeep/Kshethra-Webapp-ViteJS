import { paymentStatusDot } from '@/features/orders/presentation/lib/statusColors'
import type { OrderPaymentStatus } from '@/features/orders/domain/entities/order'

export interface OrdersKpiBandProps {
  ordersCount: number
  revenueLabel: string
  refundsCount: number
  statusCounts: Readonly<Record<OrderPaymentStatus, number>>
}

const STATUS_SUMMARY_ORDER: readonly { status: OrderPaymentStatus; label: string }[] = [
  { status: 'Paid', label: 'Paid' },
  { status: 'Pending', label: 'Pending' },
  { status: 'Partially Refunded', label: 'Partially refunded' },
  { status: 'Refunded', label: 'Refunded' },
]

/** Stat tiles (orders / revenue / refunds) plus a payment-status count cluster. */
export function OrdersKpiBand({ ordersCount, revenueLabel, refundsCount, statusCounts }: OrdersKpiBandProps) {
  const tiles = [
    { value: ordersCount.toLocaleString('en-IN'), label: 'orders' },
    { value: revenueLabel, label: 'Revenue' },
    { value: refundsCount.toLocaleString('en-IN'), label: 'Refunds' },
  ]

  return (
    <div className="flex flex-wrap items-stretch gap-2.5 px-7 pb-3.5">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex items-center gap-2.5 rounded-lg bg-card px-3.75 py-2.75 shadow-xs">
          <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{tile.value}</span>
          <span className="text-xs text-ink-subtle">{tile.label}</span>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3.5 rounded-lg bg-card px-3.75 py-2.75 shadow-xs">
        {STATUS_SUMMARY_ORDER.map(({ status, label }) => (
          <span key={status} className="inline-flex items-center gap-1.75 text-xs text-ink-subtle">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: paymentStatusDot(status) }} />
            <span className="text-base font-bold tabular-nums text-ink-strong">{statusCounts[status].toLocaleString('en-IN')}</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
