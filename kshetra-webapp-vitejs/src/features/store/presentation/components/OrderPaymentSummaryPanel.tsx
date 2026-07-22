import { formatINR } from '@/shared/lib/format'
import { Icon } from '@/shared/ui'

import type { OrderRefundEntry } from '@/features/store/domain/entities/order'

import { OverlineField, SectionLabel } from './OverlineField'

export interface OrderPaymentSummaryPanelProps {
  total: number
  receiptRef: string
  hasAddress: boolean
  refundLog: readonly OrderRefundEntry[]
  onPrintReceipt: () => void
  onPrintAddress: () => void
}

/** Left-column card: order total, receipt reference, print actions, and refund history. */
export function OrderPaymentSummaryPanel({ total, receiptRef, hasAddress, refundLog, onPrintReceipt, onPrintAddress }: OrderPaymentSummaryPanelProps) {
  return (
    <div className="flex min-w-0 flex-1 basis-[300px] flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
      <SectionLabel>Payment summary</SectionLabel>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-base text-ink-muted">Order total</span>
        <span className="text-2xl font-bold tabular-nums text-ink-strong">{formatINR(total)}</span>
      </div>
      <OverlineField label="Receipt" value={receiptRef} />
      <div className="flex flex-wrap gap-2 pt-1.5">
        <button
          type="button"
          onClick={onPrintReceipt}
          className="inline-flex h-8.5 items-center gap-1.5 rounded-md border-none bg-card px-3 font-sans text-sm font-medium text-ink shadow-xs hover:bg-hover"
        >
          <Icon name="receipt" size={15} />
          Print receipt
        </button>
        {hasAddress && (
          <button
            type="button"
            onClick={onPrintAddress}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-md border-none bg-card px-3 font-sans text-sm font-medium text-ink shadow-xs hover:bg-hover"
          >
            <Icon name="mailbox" size={15} />
            Print address
          </button>
        )}
      </div>
      {refundLog.length > 0 && (
        <div className="mt-0.5 flex flex-col gap-2 border-t border-stroke-subtle pt-3">
          <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Refund log</span>
          {refundLog.map((r, i) => (
            <div key={i} className="flex flex-col gap-0.5 rounded-md bg-sunken px-2.75 py-2.25">
              <div className="flex justify-between gap-2.5">
                <span className="text-xs font-semibold text-ink-strong">
                  {r.kind} · {formatINR(r.amount)}
                </span>
                <span className="text-2xs text-ink-subtle">{r.timestamp}</span>
              </div>
              <div className="text-xs text-ink-muted">{r.reason}</div>
              <div className="text-2xs text-ink-subtle">by {r.user}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
