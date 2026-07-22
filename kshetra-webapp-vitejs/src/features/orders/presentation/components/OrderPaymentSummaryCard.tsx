import { Icon } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

export interface OrderPaymentSummaryCardProps {
  total: number
  receiptRef: string
  onViewReceipt: () => void
}

/** Total paid + receipt reference, with a "View receipt" action. */
export function OrderPaymentSummaryCard({ total, receiptRef, onViewReceipt }: OrderPaymentSummaryCardProps) {
  return (
    <div className="flex flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Payment summary</div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Total paid</span>
        <span className="text-2xl font-bold tabular-nums text-ink-strong">{formatINR(total)}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Receipt {receiptRef}</span>
        <button
          type="button"
          onClick={onViewReceipt}
          className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border-none bg-card px-3 font-sans text-sm font-medium text-ink shadow-xs hover:bg-hover"
        >
          <Icon name="receipt" size={15} />
          View receipt
        </button>
      </div>
    </div>
  )
}
