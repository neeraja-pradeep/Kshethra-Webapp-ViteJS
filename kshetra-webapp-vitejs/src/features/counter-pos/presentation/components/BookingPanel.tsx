import { formatINR } from '@/shared/lib/format'
import { Button, Icon } from '@/shared/ui'

import type { BookingLine } from '@/features/counter-pos/domain/entities/booking'
import type { TransactionPerson } from '@/features/counter-pos/domain/entities/transaction'
import { BookingLineCard } from './BookingLineCard'

export interface BookingPanelLine {
  readonly line: BookingLine
  readonly people: readonly TransactionPerson[]
}

export interface BookingPanelProps {
  lines: readonly BookingPanelLine[]
  orderTotal: number
  orderPoojaCount: number
  paymentBlocked: boolean
  onEditLine: (id: string) => void
  onRemoveLine: (id: string) => void
  onTakePayment: () => void
}

/** The current walk-in booking (cart): configured pooja lines, running total, and checkout. */
export function BookingPanel({ lines, orderTotal, orderPoojaCount, paymentBlocked, onEditLine, onRemoveLine, onTakePayment }: BookingPanelProps) {
  const hasLines = lines.length > 0

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-card shadow-sm md:h-full md:min-h-0 md:w-[360px] md:flex-shrink-0">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-stroke px-4.5 py-3.75">
        <Icon name="receipt" size={18} className="text-primary" />
        <span className="text-base font-semibold text-ink-strong">Current booking</span>
        <div className="flex-1" />
        <span className="text-xs text-ink-subtle">
          {orderPoojaCount} {orderPoojaCount === 1 ? 'pooja' : 'poojas'}
        </span>
      </div>

      {hasLines ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
            {lines.map(({ line, people }) => (
              <BookingLineCard key={line.id} line={line} people={people} onEdit={() => onEditLine(line.id)} onRemove={() => onRemoveLine(line.id)} />
            ))}
          </div>
          <div className="flex-shrink-0 border-t border-stroke bg-sunken px-4.5 pb-4 pt-3.5">
            {paymentBlocked && (
              <div className="mb-2.5 flex items-center gap-1.75 text-xs text-warning">
                <Icon name="warning-circle" size={14} />
                Resolve the flagged pooja before taking payment.
              </div>
            )}
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Order total</span>
              <span className="text-3xl font-bold tabular-nums text-ink-strong">{formatINR(orderTotal)}</span>
            </div>
            <Button theme="primary" fullWidth size="lg" disabled={paymentBlocked} onClick={onTakePayment} iconLeft={<Icon name="credit-card" size={17} />}>
              Take payment
            </Button>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-7 py-9 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sunken text-ink-subtle ring-1 ring-inset ring-stroke-subtle">
            <Icon name="receipt" size={26} />
          </span>
          <div>
            <div className="text-base font-semibold text-ink">No poojas yet</div>
            <div className="mt-1 text-sm leading-snug text-ink-subtle">Add people, then search a pooja and pick its people &amp; dates.</div>
          </div>
        </div>
      )}
    </div>
  )
}
