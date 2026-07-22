import { Button, Icon, Textarea } from '@/shared/ui'

export interface OrderCancellationCardProps {
  cancelBlocked: boolean
  cancelReason: string
  onCancelReasonChange: (value: string) => void
  cancelDisabled: boolean
  onAskCancelOrder: () => void

  hasSelection: boolean
  selectedCount: number
  selectedAmountLabel: string
  partialAmount: string
  onPartialAmountChange: (value: string) => void
  partialReason: string
  onPartialReasonChange: (value: string) => void
  partialDisabled: boolean
  onAskPartialRefund: () => void
}

/** Cancel-entire-order and record-partial-refund controls, in one card with a divider. */
export function OrderCancellationCard(props: OrderCancellationCardProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Cancellation &amp; refund</div>

      <div className="flex flex-col gap-2.25">
        <div className="text-sm font-semibold text-ink-strong">Cancel entire order</div>
        <div className="text-xs leading-snug text-ink-subtle">Cancels every pooja and auto-refunds the full amount through the payment provider.</div>
        {props.cancelBlocked && (
          <div className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-surface px-2.75 py-2.25 text-xs text-ink">
            <Icon name="warning-circle" size={15} className="mt-px shrink-0 text-warning" />
            One or more poojas are already completed — cancel individual lines instead.
          </div>
        )}
        <Textarea
          rows={2}
          placeholder="Cancellation reason (required)"
          value={props.cancelReason}
          onChange={(e) => props.onCancelReasonChange(e.target.value)}
        />
        <div>
          <Button theme="danger" disabled={props.cancelDisabled} onClick={props.onAskCancelOrder} iconLeft={<Icon name="prohibit" size={15} />}>
            Cancel entire order
          </Button>
        </div>
      </div>

      <div className="h-px bg-stroke-subtle" />

      <div className="flex flex-col gap-2.5">
        <div className="text-sm font-semibold text-ink-strong">Partial cancellation</div>
        <div className="flex items-start gap-2 rounded-md border border-info-border bg-info-surface px-2.75 py-2.25 text-xs leading-snug text-ink">
          <Icon name="info" size={15} className="mt-px shrink-0 text-info" />
          Reconciliation record only — the actual payout happens externally. This does not process a refund.
        </div>

        {!props.hasSelection && (
          <div className="text-xs text-ink-subtle">Select one or more dates to cancel using the checkboxes in each pooja above.</div>
        )}

        {props.hasSelection && (
          <>
            <div className="flex flex-wrap items-end gap-2.5">
              <div className="flex min-w-[130px] flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Refund amount (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={props.partialAmount}
                  onChange={(e) => props.onPartialAmountChange(e.target.value)}
                  placeholder="0"
                  className="h-8.5 rounded-md border-none bg-card px-2.5 font-sans text-sm text-ink shadow-xs outline-none"
                />
              </div>
              <div className="flex min-w-[180px] flex-[2] flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Reason</span>
                <input
                  type="text"
                  value={props.partialReason}
                  onChange={(e) => props.onPartialReasonChange(e.target.value)}
                  placeholder="Reason for the refund"
                  className="h-8.5 rounded-md border-none bg-card px-2.5 font-sans text-sm text-ink shadow-xs outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-subtle">
                {props.selectedCount} dates · {props.selectedAmountLabel}
              </span>
              <div className="flex-1" />
              <Button
                theme="default"
                variant="outline"
                disabled={props.partialDisabled}
                onClick={props.onAskPartialRefund}
                iconLeft={<Icon name="note-pencil" size={15} />}
              >
                Record partial refund
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
