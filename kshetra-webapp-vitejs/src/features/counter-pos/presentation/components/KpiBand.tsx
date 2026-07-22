import { Icon } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

import type { CollectionSummary } from '@/features/counter-pos/domain/entities/collection-summary'

export interface KpiBandProps {
  summary: CollectionSummary
}

/**
 * Counter dashboard KPI row: today's collection (by payment method — collapses
 * to a single column on narrow widths so the figures never clip), today's
 * poojas, and today's transaction count.
 */
export function KpiBand({ summary }: KpiBandProps) {
  return (
    <div className="flex flex-shrink-0 flex-wrap gap-3 px-7 pb-3.5">
      <div className="flex min-w-[250px] flex-1 items-center gap-4.5 rounded-lg bg-card px-4.5 py-3 shadow-sm">
        <div className="flex-shrink-0 leading-tight">
          <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Today&apos;s collection</div>
          <div className="text-3xl font-bold tabular-nums text-ink-strong">{formatINR(summary.totalAmount)}</div>
        </div>
        <div className="my-0.5 w-px self-stretch bg-stroke-subtle" />
        <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fit,minmax(108px,1fr))] gap-y-1.5 gap-x-4">
          {summary.byMethod.map((m) => (
            <div key={m.method} className="flex items-baseline justify-between gap-2">
              <span className="whitespace-nowrap text-xs font-medium text-ink-muted">{m.method}</span>
              <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-ink">{formatINR(m.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-shrink-0 gap-3">
        <div className="flex items-center gap-3.25 rounded-lg bg-card px-4.5 py-3 shadow-sm">
          <span className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <Icon name="flame" size={20} />
          </span>
          <div className="leading-tight">
            <div className="text-2xl font-bold tabular-nums text-ink-strong">{summary.poojaCount}</div>
            <div className="text-xs font-medium text-ink-muted">Today&apos;s poojas</div>
          </div>
        </div>
        <div className="flex items-center gap-3.25 rounded-lg bg-card px-4.5 py-3 shadow-sm">
          <span className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-lg bg-sunken text-ink-muted">
            <Icon name="receipt" size={20} />
          </span>
          <div className="leading-tight">
            <div className="text-2xl font-bold tabular-nums text-ink-strong">{summary.transactionCount}</div>
            <div className="text-xs font-medium text-ink-muted">Transactions</div>
          </div>
        </div>
      </div>
    </div>
  )
}
