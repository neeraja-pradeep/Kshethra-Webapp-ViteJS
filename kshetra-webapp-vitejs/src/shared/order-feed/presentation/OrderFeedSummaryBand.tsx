import { formatCount } from '@/shared/lib/format'

import {
  ORDER_PAYMENT_STATUSES,
  orderPaymentStatusLabel,
  type OrdersSummary,
} from '@/shared/order-feed/domain/order-feed'
import { formatRevenue } from '@/shared/lib/format'
import { paymentStatusDot } from '@/shared/order-feed/presentation/paymentStatus'

export interface OrderFeedSummaryBandProps {
  summary: OrdersSummary
  /** Dimmed while a new page is loading behind the one on screen. */
  stale?: boolean
  activePaymentStatus: string
  onPaymentStatusClick: (status: string) => void
}

/**
 * The tiles above the table, straight off the server's `summary`.
 *
 * Nothing here is computed from the loaded rows: `summary` counts the whole
 * filtered set, and only one page is ever in memory. `amount` is already net of
 * refunds and reconciliations — it is not `total` summed, and `refunds.amount`
 * must not be taken off it again.
 */
export function OrderFeedSummaryBand({
  summary,
  stale = false,
  activePaymentStatus,
  onPaymentStatusClick,
}: OrderFeedSummaryBandProps) {
  const tiles = [
    { key: 'orders', value: formatCount(summary.total), label: summary.total === 1 ? 'order' : 'orders' },
    { key: 'revenue', value: formatRevenue(summary.amount), label: 'Revenue' },
    { key: 'refunds', value: formatCount(summary.refunds.count), label: 'Refunds' },
  ]

  return (
    <div
      className={`flex flex-wrap items-stretch gap-2.5 px-7 pb-3.5 ${stale ? 'opacity-60' : ''}`}
      aria-busy={stale}
    >
      {tiles.map((tile) => (
        <div key={tile.key} className="flex items-center gap-2.5 rounded-lg bg-card px-3.75 py-2.75 shadow-xs">
          <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{tile.value}</span>
          <span className="text-xs text-ink-subtle">{tile.label}</span>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-card px-2 py-1.5 shadow-xs">
        {/*
          Rendered from the statuses we expect, not the keys we got: the server
          omits a status with no orders, so reading its own keys would make a
          zero tile vanish instead of reading zero.
        */}
        {ORDER_PAYMENT_STATUSES.map((status) => {
          const count = summary.byPaymentStatus[status] ?? 0
          const active = activePaymentStatus === status
          return (
            <button
              key={status}
              type="button"
              title={`Filter to ${orderPaymentStatusLabel(status)}`}
              aria-pressed={active}
              onClick={() => onPaymentStatusClick(status)}
              className={`inline-flex cursor-pointer items-center gap-1.75 rounded-md border-none px-2 py-1 font-sans text-xs text-ink-subtle hover:bg-hover ${
                active ? 'bg-active' : 'bg-transparent'
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: paymentStatusDot(status) }} />
              <span className="text-base font-bold tabular-nums text-ink-strong">{formatCount(count)}</span>
              {orderPaymentStatusLabel(status)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
