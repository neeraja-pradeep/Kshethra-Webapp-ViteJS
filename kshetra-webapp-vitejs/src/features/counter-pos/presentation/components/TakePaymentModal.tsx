import { formatINR } from '@/shared/lib/format'
import { Button, Icon } from '@/shared/ui'

import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import { PAYMENT_METHODS } from '@/features/counter-pos/presentation/data/payment-methods.mock'
import { MethodTile } from './MethodTile'

export interface TakePaymentModalProps {
  open: boolean
  total: number
  method: PaymentMethod
  onSelectMethod: (method: PaymentMethod) => void
  onClose: () => void
  onConfirm: () => void
}

/** Checkout dialog: amount due as an overline caption over a large maroon figure, then method tiles. */
export function TakePaymentModal({ open, total, method, onSelectMethod, onClose, onConfirm }: TakePaymentModalProps) {
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

        <div className="grid grid-cols-2 gap-2.5 px-5.5 pb-1.5 pt-3">
          {PAYMENT_METHODS.map((m) => (
            <MethodTile key={m} method={m} selected={m === method} onSelect={() => onSelectMethod(m)} />
          ))}
        </div>

        <div className="flex justify-end gap-2 px-5.5 pb-4.5 pt-4">
          <Button theme="default" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button theme="primary" onClick={onConfirm} iconLeft={<Icon name="check" size={16} />}>
            Confirm &amp; print receipt
          </Button>
        </div>
      </div>
    </div>
  )
}
