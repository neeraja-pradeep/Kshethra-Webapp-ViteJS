import { useState } from 'react'

import { formatINR } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { Button, Icon, Modal } from '@/shared/ui'

export interface WalkInPaymentModalProps {
  open: boolean
  total: number
  onClose: () => void
  onConfirm: (method: string) => void
}

const METHODS: { label: string; icon: string }[] = [
  { label: 'Cash', icon: 'money' },
  { label: 'Card', icon: 'credit-card' },
  { label: 'UPI', icon: 'device-mobile' },
  { label: 'Net banking', icon: 'bank' },
]

/** "Take payment" dialog for the walk-in POS — pick a method, confirm, and print. */
export function WalkInPaymentModal({ open, total, onClose, onConfirm }: WalkInPaymentModalProps) {
  const [method, setMethod] = useState('Cash')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Take payment"
      description="Over-the-counter sale — collected now."
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button theme="primary" iconLeft={<Icon name="check" size={16} />} onClick={() => onConfirm(method)}>
            Confirm &amp; print receipt
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between py-1">
          <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Amount due</span>
          <span className="text-4xl font-bold tabular-nums text-primary">{formatINR(total)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {METHODS.map((m) => {
            const active = method === m.label
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => setMethod(m.label)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3.5 py-3.25 text-left font-sans text-base font-medium',
                  active ? 'bg-primary-subtle text-primary-subtle-text ring-2 ring-inset ring-primary' : 'bg-card text-ink ring-1 ring-inset ring-stroke',
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
