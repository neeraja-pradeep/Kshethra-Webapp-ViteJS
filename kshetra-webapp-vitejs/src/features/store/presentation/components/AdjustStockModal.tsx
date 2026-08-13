import { useEffect, useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Alert, Button, Icon, Input, Modal } from '@/shared/ui'

import {
  resultingQuantity,
  validateStockAdjustment,
  type StockChange,
} from '@/features/store/domain/entities/stock-adjustment'

type Mode = 'set' | 'delta'

export interface AdjustStockModalProps {
  open: boolean
  productName: string
  currentStock: number
  saving: boolean
  /** Whatever the server refused, if it got that far. */
  errorMessage: string | null
  onClose: () => void
  onSave: (change: StockChange, reason: string) => void
}

/**
 * Adjust stock — a stock take or a movement, never ambiguously both.
 *
 * The API takes `quantity` **or** `delta` and refuses both or neither, so the
 * two are offered as an explicit choice rather than inferred from a single
 * number. "There are 40 on the shelf" and "12 arrived" are different
 * statements, and guessing which was meant is how a stock take goes wrong.
 */
export function AdjustStockModal({
  open,
  productName,
  currentStock,
  saving,
  errorMessage,
  onClose,
  onSave,
}: AdjustStockModalProps) {
  const [mode, setMode] = useState<Mode>('set')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setMode('set')
    setValue(String(currentStock))
    setReason('')
    setTouched(false)
  }, [open, currentStock])

  const parsed = Number(value)
  const change: StockChange =
    mode === 'set' ? { kind: 'set', quantity: parsed } : { kind: 'delta', delta: parsed }
  const next = value === '' ? currentStock : resultingQuantity(currentStock, change)
  // The same four refusals the server applies, checked here so the operator is
  // not round-tripped to be told something we already knew.
  const problem = value === '' ? 'Enter a number.' : validateStockAdjustment(currentStock, { change, reason })

  const switchMode = (to: Mode) => {
    setMode(to)
    setValue(to === 'set' ? String(currentStock) : '')
    setTouched(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust stock"
      description={`${productName} · ${currentStock} on the shelf`}
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            theme="primary"
            loading={saving}
            disabled={saving || problem !== null}
            onClick={() => onSave(change, reason.trim())}
          >
            Save change
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5 py-1">
        {errorMessage && <Alert type="danger">{errorMessage}</Alert>}

        <div className="flex gap-1 rounded-lg bg-active p-0.75">
          {(
            [
              { key: 'set', label: 'Count on the shelf' },
              { key: 'delta', label: 'Add or remove' },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => switchMode(option.key)}
              className={cn(
                'flex-1 rounded-md border-none px-3 py-1.5 font-sans text-xs font-medium',
                mode === option.key ? 'bg-card text-ink-strong shadow-xs' : 'bg-transparent text-ink-muted',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Input
          label={mode === 'set' ? 'New stock quantity' : 'Change by'}
          type="number"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setTouched(true)
          }}
          hint={mode === 'set' ? 'After a stock take.' : '60 for a delivery, -5 for damage.'}
          error={touched ? problem ?? undefined : undefined}
        />

        <Input
          label="Reason"
          required
          placeholder="e.g. New stock received, damage, stock-take"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setTouched(true)
          }}
        />

        {value !== '' && !Number.isNaN(parsed) && (
          <div className="flex items-center gap-2 rounded-md bg-sunken px-3 py-2.25 text-sm">
            <Icon name="arrow-right" size={14} className="text-ink-subtle" />
            <span className="tabular-nums text-ink-muted">{currentStock}</span>
            <Icon name="arrow-right" size={12} className="text-ink-subtle" />
            <span className={cn('tabular-nums font-semibold', next < 0 ? 'text-danger' : 'text-ink-strong')}>
              {next}
            </span>
            <span className="text-xs text-ink-subtle">on the shelf</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
