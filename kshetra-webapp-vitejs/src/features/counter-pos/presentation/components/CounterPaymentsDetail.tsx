import { formatINR } from '@/shared/lib/format'
import { Button, Icon } from '@/shared/ui'

import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import { PAYMENT_METHODS } from '@/features/counter-pos/presentation/data/payment-methods.mock'
import { MethodTile } from './MethodTile'

export interface CounterPaymentsDetailProps {
  booking: AgentBooking
  method: PaymentMethod
  onSelectMethod: (method: PaymentMethod) => void
  onViewBooking: () => void
  onRecord: () => void
}

/** Selected app-agent booking: summary, payment method picker, and record action. */
export function CounterPaymentsDetail({ booking, method, onSelectMethod, onViewBooking, onRecord }: CounterPaymentsDetailProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5.5 py-4.5">
      <div className="flex flex-wrap gap-x-5 gap-y-4 rounded-lg bg-active px-4 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">Order</span>
          <span className="text-sm font-semibold text-ink-strong">{booking.orderRef}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">Devotee</span>
          <span className="text-sm text-ink">{booking.devotee}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">Phone</span>
          <span className="text-sm text-ink">{booking.phone || '—'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">Agent code</span>
          <span className="font-mono text-sm text-ink">{booking.code}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg px-4 py-3.5 ring-1 ring-inset ring-stroke-subtle">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink-strong">{booking.poojaSummary}</span>
          <span className="text-xl font-bold tabular-nums text-ink-strong">{formatINR(booking.amount)}</span>
        </div>
        <span className="text-xs text-ink-subtle">
          {booking.poojaCount} poojas · first date {booking.date}
        </span>
      </div>

      <div className="flex flex-col gap-2.25">
        <span className="text-sm font-medium text-ink">Payment method</span>
        <div className="grid grid-cols-2 gap-2.5">
          {PAYMENT_METHODS.map((m) => (
            <MethodTile key={m} method={m} selected={m === method} onSelect={() => onSelectMethod(m)} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button theme="default" variant="outline" onClick={onViewBooking} iconLeft={<Icon name="arrow-square-out" size={15} />}>
          View in Pooja Bookings
        </Button>
        <div className="flex-1" />
        <Button theme="primary" onClick={onRecord} iconLeft={<Icon name="check" size={16} />}>
          Record payment &amp; print
        </Button>
      </div>
    </div>
  )
}
