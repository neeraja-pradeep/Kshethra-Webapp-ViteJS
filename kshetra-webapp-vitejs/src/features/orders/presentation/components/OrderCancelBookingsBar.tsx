import { Button, Icon, Input } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

export interface OrderCancelBookingsBarProps {
  selectedCount: number
  selectedAmount: number
  reason: string
  onReasonChange: (value: string) => void
  onClear: () => void
  onAskCancel: () => void
  submitting: boolean
}

/**
 * The bar that appears once dates are ticked.
 *
 * There is no amount to type: the server works out what the selected bookings
 * are worth and reconciles exactly that. The figure shown is the sum of their
 * prices, for the operator's benefit — it is not sent, and cannot disagree with
 * what is actually written off.
 */
export function OrderCancelBookingsBar(props: OrderCancelBookingsBarProps) {
  if (props.selectedCount === 0) return null

  return (
    <div className="sticky bottom-0 z-raised flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 shadow-lg">
      <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-strong">
        <Icon name="calendar-x" size={16} className="text-ink-subtle" />
        {props.selectedCount} {props.selectedCount === 1 ? 'date' : 'dates'} selected
        <span className="text-ink-subtle">·</span>
        <span className="tabular-nums">{formatINR(props.selectedAmount)}</span>
      </span>

      <div className="min-w-[220px] flex-1">
        <Input
          size="sm"
          placeholder="Reason (optional)"
          value={props.reason}
          onChange={(e) => props.onReasonChange(e.target.value)}
        />
      </div>

      <Button variant="ghost" size="sm" onClick={props.onClear} disabled={props.submitting}>
        Clear
      </Button>
      <Button theme="danger" size="sm" onClick={props.onAskCancel} loading={props.submitting} disabled={props.submitting}>
        Cancel dates
      </Button>
    </div>
  )
}
