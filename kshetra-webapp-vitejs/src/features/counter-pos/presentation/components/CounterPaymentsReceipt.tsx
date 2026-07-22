import { formatINR } from '@/shared/lib/format'
import { Button, Icon } from '@/shared/ui'

import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'

export interface CounterPaymentsReceiptProps {
  booking: AgentBooking
  templeName: string
  onDone: () => void
  onPrint: () => void
}

/** Compact thermal-style receipt printed once a counter payment has been recorded. */
export function CounterPaymentsReceipt({ booking, templeName, onDone, onPrint }: CounterPaymentsReceiptProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-5.5 py-4.5">
      <div className="flex w-[330px] flex-col rounded-xl bg-card px-6 py-5.5 shadow-xs">
        <div className="border-b border-dashed border-stroke-strong pb-3 text-center">
          <span className="inline-flex h-9.5 w-9.5 items-center justify-center rounded-lg bg-primary text-2xl font-black leading-none text-primary-contrast">
            क
          </span>
          <div className="mt-2 text-lg font-bold text-ink-strong">{templeName}</div>
          <div className="mt-0.5 text-xs text-ink-subtle">Counter payment receipt</div>
        </div>

        <div className="flex justify-between gap-3 border-b border-dashed border-stroke-strong py-2.75 text-sm">
          <div className="flex flex-col gap-0.75">
            <span className="text-xs text-ink-subtle">Order</span>
            <span className="font-semibold text-ink-strong">{booking.orderRef}</span>
          </div>
          <div className="flex flex-col gap-0.75 text-right">
            <span className="text-xs text-ink-subtle">Devotee</span>
            <span className="font-medium text-ink-strong">{booking.devotee}</span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 border-b border-dashed border-stroke-strong py-2.75">
          <span className="text-sm font-medium text-ink-strong">{booking.poojaSummary}</span>
          <span className="text-xs text-ink-subtle">
            Agent code {booking.code} · {booking.poojaCount} poojas
          </span>
        </div>

        <div className="flex items-baseline justify-between pb-1 pt-3">
          <span className="text-base font-semibold text-ink-strong">Total paid</span>
          <span className="text-2xl font-bold tabular-nums text-ink-strong">{formatINR(booking.amount)}</span>
        </div>
        <div className="pt-1.5 text-xs text-ink-muted">Paid by {booking.method ?? '—'} at counter</div>

        <div className="mt-3 text-center text-xs italic text-ink-subtle">Thank you · {'शुभमस्तु'}</div>
      </div>

      <div className="flex gap-2.5">
        <Button theme="default" variant="outline" onClick={onDone}>
          Done
        </Button>
        <Button theme="primary" onClick={onPrint} iconLeft={<Icon name="printer" size={16} />}>
          Print receipt
        </Button>
      </div>
    </div>
  )
}
