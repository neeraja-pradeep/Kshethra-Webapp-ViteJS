import { formatINR } from '@/shared/lib/format'
import { Alert, Button, Icon } from '@/shared/ui'

import { PAYMENT_METHODS, type PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import { MethodTile } from './MethodTile'

export interface TakePaymentModalProps {
  open: boolean
  total: number
  method: PaymentMethod
  onSelectMethod: (method: PaymentMethod) => void
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  errorMessage: string
}

/** Checkout dialog: amount due as an overline caption over a large maroon figure, then method tiles. */
export function TakePaymentModal({
  open,
  total,
  method,
  onSelectMethod,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}: TakePaymentModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-overlay p-6 [backdrop-filter:blur(2px)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Take payment"
        onClick={(e) => e.stopPropagation()}
        className="flex w-[460px] max-w-full flex-col overflow-hidden rounded-3xl bg-card shadow-xl"
      >
        <div className="px-5.5 pb-2.5 pt-5">
          <h2 className="m-0 text-xl font-semibold text-ink-strong">Take payment</h2>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Choose how the devotee is paying.</p>
        </div>

        <div className="flex items-baseline justify-between px-5.5 py-2">
          <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Amount due</span>
          <span className="text-4xl font-bold tabular-nums text-primary">{formatINR(total)}</span>
        </div>
        <p className="m-0 px-5.5 pb-1 text-2xs text-ink-subtle">Priced from the catalogue — the receipt shows the temple's recorded total.</p>

        <div className="grid grid-cols-2 gap-2.5 px-5.5 pb-1.5 pt-3">
          {PAYMENT_METHODS.map((m) => (
            <MethodTile key={m} method={m} selected={m === method} onSelect={() => onSelectMethod(m)} />
          ))}
        </div>

        {errorMessage && (
          <div className="px-5.5 pt-3">
            <Alert type="danger">{errorMessage}</Alert>
          </div>
        )}

        <div className="flex justify-end gap-2 px-5.5 pb-4.5 pt-4">
          <Button theme="default" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {/* Disabled while in flight: a second click is a second sale, and the
              only way to undo one is to void it and ring it up again. */}
          <Button theme="primary" onClick={onConfirm} disabled={isSubmitting} iconLeft={<Icon name="check" size={16} />}>
            {isSubmitting ? 'Recording sale…' : 'Confirm & print receipt'}
          </Button>
        </div>
      </div>
    </div>
  )
}
