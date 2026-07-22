import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'

export interface AgentCodeUsageRowView {
  readonly orderRef: string
  readonly devotee: string
  readonly poojaSummary: string
  readonly date: string
  readonly amount: number
  readonly paid: boolean
}

export interface AgentCodeUsageCardProps {
  usedLabel: string
  orderValueLabel: string
  summaryLabel: string
  rows: AgentCodeUsageRowView[]
}

/** Usage stats (times used / order value) and the per-booking usage history. */
export function AgentCodeUsageCard({ usedLabel, orderValueLabel, summaryLabel, rows }: AgentCodeUsageCardProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Usage</div>
        <div className="flex-1" />
        <span className="text-2xs text-ink-subtle">{summaryLabel}</span>
      </div>

      <div className="flex flex-wrap gap-3.5">
        <div className="flex min-w-[150px] flex-1 items-center gap-3 rounded-lg bg-active px-4 py-3.5">
          <span className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <Icon name="ticket" size={19} />
          </span>
          <div>
            <div className="text-2xl font-bold tabular-nums text-ink-strong">{usedLabel}</div>
            <div className="text-2xs text-ink-subtle">Times used</div>
          </div>
        </div>
        <div className="flex min-w-[150px] flex-1 items-center gap-3 rounded-lg bg-active px-4 py-3.5">
          <span className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-success-surface text-success">
            <Icon name="currency-inr" size={19} />
          </span>
          <div>
            <div className="text-2xl font-bold tabular-nums text-ink-strong">{orderValueLabel}</div>
            <div className="text-2xs text-ink-subtle">Total order value</div>
          </div>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="flex flex-col overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--border-subtle)]">
          <div className="flex items-center gap-3 bg-sunken px-3.5 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
            <span className="w-24">Order</span>
            <span className="flex-1">Devotee · pooja</span>
            <span className="w-[92px]">Date</span>
            <span className="w-[88px] text-right">Amount</span>
            <span className="w-24 text-right">Payment</span>
            <span className="w-4.5" />
          </div>
          {rows.map((row) => (
            <div key={row.orderRef} className="flex items-center gap-3 border-t border-stroke-subtle px-3.5 py-2.75 text-sm">
              <span className="w-24 font-semibold text-ink-strong">{row.orderRef}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-ink-strong">{row.devotee}</span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-2xs text-ink-subtle">{row.poojaSummary}</span>
              </span>
              <span className="w-[92px] whitespace-nowrap text-ink-muted">{row.date}</span>
              <span className="w-[88px] text-right tabular-nums text-ink">{formatINR(row.amount)}</span>
              <span className="flex w-24 justify-end">
                <span
                  className={cn(
                    'inline-flex h-4.5 items-center rounded-full px-1.5 text-2xs font-medium',
                    row.paid ? 'bg-success-surface text-success-strong' : 'bg-warning-surface text-warning-strong',
                  )}
                >
                  {row.paid ? 'Paid' : 'At counter'}
                </span>
              </span>
              <Icon name="arrow-up-right" size={13} className="w-4.5 text-ink-subtle" />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-0.5 py-3.5 text-sm text-ink-subtle">This code hasn’t been used on any bookings yet.</div>
      )}
    </div>
  )
}
