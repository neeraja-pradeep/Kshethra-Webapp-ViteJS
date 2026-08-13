import { useEffect, useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Alert, Button, Icon, Modal } from '@/shared/ui'

import type { WalkInPaymentMethod } from '@/features/store/domain/entities/store-order'

export interface WalkInPaymentModalProps {
  open: boolean
  total: number
  saving: boolean
  errorMessage: string | null
  onClose: () => void
  onConfirm: (method: WalkInPaymentMethod) => void
}

/**
 * The tender types the counter accepts.
 *
 * Never `razorpay` or `cod`: there is no gateway at the desk — the money is
 * handed over, so payment is *recorded* rather than processed. The server
 * refuses anything else.
 */
const METHODS: { value: WalkInPaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: 'money' },
  { value: 'card', label: 'Card', icon: 'credit-card' },
  { value: 'upi', label: 'UPI', icon: 'device-mobile' },
  { value: 'netbanking', label: 'Net banking', icon: 'bank' },
]

/** "Take payment" dialog for the walk-in POS. */
export function WalkInPaymentModal({
  open,
  total,
  saving,
  errorMessage,
  onClose,
  onConfirm,
}: WalkInPaymentModalProps) {
  const [method, setMethod] = useState<WalkInPaymentMethod>('cash')

  useEffect(() => {
    if (open) setMethod('cash')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Take payment"
      description="Over-the-counter sale — collected now."
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            theme="primary"
            iconLeft={<Icon name="check" size={16} />}
            loading={saving}
            disabled={saving}
            onClick={() => onConfirm(method)}
          >
            Confirm sale
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {errorMessage && <Alert type="danger">{errorMessage}</Alert>}
        <div className="flex items-baseline justify-between py-1">
          <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Amount due</span>
          <span className="text-4xl font-bold tabular-nums text-primary">{formatINR(total)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {METHODS.map((m) => {
            const active = method === m.value
            return (
              <button
                key={m.value}
                type="button"
                disabled={saving}
                onClick={() => setMethod(m.value)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3.5 py-3.25 text-left font-sans text-base font-medium',
                  active
                    ? 'bg-primary-subtle text-primary-subtle-text ring-2 ring-inset ring-primary'
                    : 'bg-card text-ink ring-1 ring-inset ring-stroke',
                )}
              >
                <Icon name={m.icon} size={20} />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
