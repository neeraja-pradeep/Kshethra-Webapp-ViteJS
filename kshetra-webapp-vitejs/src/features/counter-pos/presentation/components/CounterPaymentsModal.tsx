import { Icon } from '@/shared/ui'

import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import { CounterPaymentsDetail } from './CounterPaymentsDetail'
import { CounterPaymentsList } from './CounterPaymentsList'
import { CounterPaymentsReceipt } from './CounterPaymentsReceipt'

export type CounterPaymentsMode = 'list' | 'detail' | 'receipt'

export interface CounterPaymentsModalProps {
  open: boolean
  mode: CounterPaymentsMode
  search: string
  onSearchChange: (value: string) => void
  rows: readonly AgentBooking[]
  selected: AgentBooking | null
  method: PaymentMethod
  onSelectMethod: (method: PaymentMethod) => void
  onSelectRow: (orderRef: string) => void
  onBack: () => void
  onClose: () => void
  onViewBooking: () => void
  onRecord: () => void
  onDone: () => void
  onPrint: () => void
  templeName: string
}

const TITLE: Record<CounterPaymentsMode, string> = {
  list: 'Counter payments',
  detail: 'Booking',
  receipt: 'Payment recorded',
}
const SUBTITLE: Record<CounterPaymentsMode, string> = {
  list: 'Find a mobile-app agent-code booking and record its counter payment.',
  detail: 'Record the counter payment for this app booking.',
  receipt: 'Receipt ready to print.',
}

/** "Counter payments" — find an app agent-code booking and record its counter payment. */
export function CounterPaymentsModal({
  open,
  mode,
  search,
  onSearchChange,
  rows,
  selected,
  method,
  onSelectMethod,
  onSelectRow,
  onBack,
  onClose,
  onViewBooking,
  onRecord,
  onDone,
  onPrint,
  templeName,
}: CounterPaymentsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay p-6 [backdrop-filter:blur(2px)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Counter payments"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[86vh] w-[660px] max-w-full flex-col overflow-hidden rounded-3xl bg-card shadow-xl"
      >
        <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-stroke px-5.5 pb-3.5 pt-4.5">
          {mode === 'detail' && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover"
            >
              <Icon name="arrow-left" size={17} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-xl font-semibold text-ink-strong">{mode === 'detail' && selected ? `Booking ${selected.orderRef}` : TITLE[mode]}</h2>
            <p className="m-0 mt-1 text-sm text-ink-subtle">{SUBTITLE[mode]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        {mode === 'list' && <CounterPaymentsList search={search} onSearchChange={onSearchChange} rows={rows} onSelect={onSelectRow} />}
        {mode === 'detail' && selected && (
          <CounterPaymentsDetail booking={selected} method={method} onSelectMethod={onSelectMethod} onViewBooking={onViewBooking} onRecord={onRecord} />
        )}
        {mode === 'receipt' && selected && <CounterPaymentsReceipt booking={selected} templeName={templeName} onDone={onDone} onPrint={onPrint} />}
      </div>
    </div>
  )
}
