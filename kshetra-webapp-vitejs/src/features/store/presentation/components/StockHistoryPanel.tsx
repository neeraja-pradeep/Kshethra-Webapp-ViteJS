import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui'

import type { StockAdjustmentEntry } from '@/features/store/domain/entities/stock-adjustment'

export interface StockHistoryPanelProps {
  entries: readonly StockAdjustmentEntry[]
  loading: boolean
  errorMessage: string | null
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return (
    date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  )
}

/**
 * The stock adjustment log, newest first.
 *
 * Every line is the server's record — who moved it, from what to what, and why
 * — rather than a sentence the client assembled. Sales are deliberately absent:
 * stock leaving through a checkout is already accounted for by the order that
 * took it, and logging it again would read as the shelf having been counted
 * twice.
 */
export function StockHistoryPanel({ entries, loading, errorMessage }: StockHistoryPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5 py-3 text-ink-subtle">
        <Spinner size={16} />
        <span className="text-xs">Loading stock history…</span>
      </div>
    )
  }

  if (errorMessage) {
    return <div className="py-2 text-xs text-danger-strong">{errorMessage}</div>
  }

  if (entries.length === 0) {
    return <div className="py-2 text-2xs text-ink-subtle">No stock adjustments recorded yet.</div>
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
        Stock adjustment log
      </span>
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-baseline justify-between gap-3 rounded-md bg-sunken px-3 py-2.25">
          <div className="min-w-0">
            <span
              className={cn(
                'tabular-nums text-sm font-medium',
                entry.delta >= 0 ? 'text-success-strong' : 'text-danger-strong',
              )}
            >
              {entry.delta >= 0 ? '+' : ''}
              {entry.delta}
            </span>
            <span className="tabular-nums text-sm text-ink-strong">
              {' '}
              · {entry.quantityBefore} → {entry.quantityAfter}
            </span>
            {entry.reason && <span className="text-xs text-ink-muted"> · {entry.reason}</span>}
          </div>
          <span className="whitespace-nowrap text-2xs text-ink-subtle">
            {entry.adjustedBy}
            {entry.adjustedBy && ' · '}
            {formatWhen(entry.createdAt)}
          </span>
        </div>
      ))}
    </div>
  )
}
