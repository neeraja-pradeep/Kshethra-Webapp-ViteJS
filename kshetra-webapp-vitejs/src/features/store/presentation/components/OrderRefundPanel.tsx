import { formatINR } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { Button, Icon, Textarea } from '@/shared/ui'

import { SectionLabel } from './OverlineField'

export interface RefundableItem {
  productId: string
  name: string
  qty: number
  lineTotal: number
  selected: boolean
}

export interface OrderRefundPanelProps {
  resolved: boolean
  resolvedNote: string
  showFull: boolean
  fullReason: string
  fullDisabled: boolean
  onFullReasonChange: (v: string) => void
  onAskFullRefund: () => void
  showPartial: boolean
  refundItems: RefundableItem[]
  onToggleRefundItem: (productId: string) => void
  partialAmount: string
  onPartialAmountChange: (v: string) => void
  partialReason: string
  onPartialReasonChange: (v: string) => void
  partialCaptureNote: string
  partialDisabled: boolean
  onAskPartialRefund: () => void
}

/** Right-column card: full cancel-and-refund, or a partial-refund reconciliation record. */
export function OrderRefundPanel({
  resolved,
  resolvedNote,
  showFull,
  fullReason,
  fullDisabled,
  onFullReasonChange,
  onAskFullRefund,
  showPartial,
  refundItems,
  onToggleRefundItem,
  partialAmount,
  onPartialAmountChange,
  partialReason,
  onPartialReasonChange,
  partialCaptureNote,
  partialDisabled,
  onAskPartialRefund,
}: OrderRefundPanelProps) {
  return (
    <div className="flex min-w-0 flex-1 basis-[420px] flex-[2] flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <SectionLabel>Cancellation &amp; refund</SectionLabel>

      {resolved && (
        <div className="flex items-start gap-2 rounded-md bg-sunken px-2.75 py-2.75 text-sm leading-snug text-ink-muted">
          <Icon name="check-circle" size={16} className="mt-px flex-shrink-0 text-ink-subtle" />
          {resolvedNote}
        </div>
      )}

      {showFull && (
        <div className="flex flex-col gap-2.25">
          <div className="text-sm font-semibold text-ink-strong">Full refund</div>
          <div className="text-xs leading-snug text-ink-subtle">
            Available while the order is unfulfilled. Cancels the order and auto-refunds the full amount through the payment gateway.
          </div>
          <Textarea rows={2} placeholder="Refund reason (required)" value={fullReason} onChange={(e) => onFullReasonChange(e.target.value)} />
          <div>
            <Button theme="danger" disabled={fullDisabled} iconLeft={<Icon name="arrow-counter-clockwise" size={15} />} onClick={onAskFullRefund}>
              Cancel &amp; refund fully
            </Button>
          </div>
        </div>
      )}

      {showPartial && (
        <div className="flex flex-col gap-2.5">
          <div className="text-sm font-semibold text-ink-strong">Partial refund</div>
          <div className="flex items-start gap-2 rounded-md border border-info-border bg-info-surface px-2.75 py-2.25 text-xs leading-snug text-ink">
            <Icon name="info" size={15} className="mt-px flex-shrink-0 text-info" />
            Reconciliation record only — the payout happens externally. This does not move money.
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink">Select items to refund</span>
            {refundItems.map((ri) => (
              <button
                key={ri.productId}
                type="button"
                onClick={() => onToggleRefundItem(ri.productId)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.75 py-2 text-left font-sans',
                  ri.selected ? 'bg-primary-subtle ring-2 ring-inset ring-primary' : 'bg-card ring-1 ring-inset ring-stroke',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-sm text-white',
                    ri.selected ? 'bg-primary' : 'bg-transparent ring-2 ring-inset ring-stroke-strong',
                  )}
                >
                  {ri.selected && <Icon name="check" weight="fill" size={12} />}
                </span>
                <span className="min-w-0 flex-1 text-sm text-ink">
                  {ri.name} <span className="text-ink-subtle">× {ri.qty}</span>
                </span>
                <span className="tabular-nums text-sm text-ink-muted">{formatINR(ri.lineTotal)}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex min-w-[130px] flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Refund amount (₹)</span>
              <input
                type="number"
                min={0}
                value={partialAmount}
                onChange={(e) => onPartialAmountChange(e.target.value)}
                placeholder="0"
                className="h-8.5 rounded-md border-none bg-card px-2.75 font-sans text-sm text-ink shadow-xs outline-none"
              />
            </div>
            <div className="flex min-w-[190px] flex-[2] flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Reason</span>
              <input
                type="text"
                value={partialReason}
                onChange={(e) => onPartialReasonChange(e.target.value)}
                placeholder="Reason for the refund"
                className="h-8.5 rounded-md border-none bg-card px-2.75 font-sans text-sm text-ink shadow-xs outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-subtle">{partialCaptureNote}</span>
            <div className="flex-1" />
            <Button theme="default" variant="outline" disabled={partialDisabled} iconLeft={<Icon name="note-pencil" size={15} />} onClick={onAskPartialRefund}>
              Record partial refund
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
