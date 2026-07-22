import { formatINR } from '@/shared/lib/format'
import type { OrderRefundLogEntry } from '@/features/orders/domain/entities/order'

export interface OrderRefundLogCardProps {
  entries: readonly OrderRefundLogEntry[]
}

/** Table of cancellation/refund actions recorded against this order this session. */
export function OrderRefundLogCard({ entries }: OrderRefundLogCardProps) {
  if (entries.length === 0) return null
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Refund log</div>
      <div className="flex flex-col">
        <div className="flex gap-3 border-b border-stroke py-2 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
          <span className="w-[110px] shrink-0">Amount</span>
          <span className="flex-1">Reason</span>
          <span className="w-[120px] shrink-0">User</span>
          <span className="w-[170px] shrink-0">Timestamp</span>
        </div>
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-3 border-b border-stroke-subtle py-2.5 text-sm text-ink">
            <span className="w-[110px] shrink-0 font-semibold tabular-nums text-ink-strong">{formatINR(entry.amount)}</span>
            <span className="flex-1 text-ink-muted">{entry.reason}</span>
            <span className="w-[120px] shrink-0">{entry.user}</span>
            <span className="w-[170px] shrink-0 text-ink-muted">{entry.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
