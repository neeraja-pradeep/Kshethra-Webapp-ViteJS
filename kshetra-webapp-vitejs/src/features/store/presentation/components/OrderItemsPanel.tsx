import { formatINR } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { Button, Icon } from '@/shared/ui'

import { SectionLabel } from './OverlineField'

export interface OrderItemRow {
  productId: string
  name: string
  category: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export interface OrderItemsPanelProps {
  items: OrderItemRow[]
  editing: boolean
  canEdit: boolean
  reductionAmount: number
  saveDisabled: boolean
  isIncDisabled: (productId: string) => boolean
  onToggleEdit: () => void
  onDec: (productId: string) => void
  onInc: (productId: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
}

/** Order line items — read-only, or an editable quantity-reduction mode that records a partial refund. */
export function OrderItemsPanel({ items, editing, canEdit, reductionAmount, saveDisabled, isIncDisabled, onToggleEdit, onDec, onInc, onCancelEdit, onSaveEdit }: OrderItemsPanelProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <SectionLabel>Items</SectionLabel>
        <div className="flex-1" />
        {canEdit && (
          <button
            type="button"
            onClick={onToggleEdit}
            className={cn(
              'inline-flex h-7.5 items-center gap-1.5 rounded-md border-none bg-card px-2.75 font-sans text-xs font-medium shadow-xs hover:bg-hover',
              editing ? 'text-primary' : 'text-ink',
            )}
          >
            <Icon name={editing ? 'pencil-simple-line' : 'pencil-simple'} size={14} />
            {editing ? 'Editing…' : 'Edit items'}
          </button>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-lg ring-1 ring-inset ring-stroke-subtle">
        <div className="flex items-center gap-3 bg-sunken px-3.5 py-2 text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
          <span className="flex-1">Product</span>
          <span className="w-28 text-center">Qty</span>
          <span className="w-24 text-right">Unit price</span>
          <span className="w-[104px] text-right">Line total</span>
        </div>
        {items.map((it, i) => (
          <div
            key={it.productId}
            className={cn('flex items-center gap-3 px-3.5 py-2.75', i > 0 && 'border-t border-stroke-subtle', editing && it.qty === 0 && 'opacity-50')}
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink-strong">{it.name}</div>
              <div className="text-xs text-ink-subtle">{it.category}</div>
            </div>
            <div className="flex w-28 justify-center">
              {editing ? (
                <div className="flex items-center gap-0.5 rounded-md bg-card p-0.5 shadow-xs">
                  <button
                    type="button"
                    aria-label="Reduce"
                    onClick={() => onDec(it.productId)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-sm border-none bg-transparent text-ink-muted hover:bg-hover"
                  >
                    <Icon name="minus" size={12} />
                  </button>
                  <span className="min-w-6 text-center tabular-nums text-sm font-semibold text-ink-strong">{it.qty}</span>
                  <button
                    type="button"
                    aria-label="Increase"
                    disabled={isIncDisabled(it.productId)}
                    onClick={() => onInc(it.productId)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-sm border-none bg-transparent text-ink-muted hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon name="plus" size={12} />
                  </button>
                </div>
              ) : (
                <span className="tabular-nums text-sm text-ink">{it.qty}</span>
              )}
            </div>
            <span className="w-24 text-right tabular-nums text-sm text-ink">{formatINR(it.unitPrice)}</span>
            <span className="w-[104px] text-right tabular-nums text-sm font-semibold text-ink-strong">{formatINR(it.lineTotal)}</span>
          </div>
        ))}
      </div>

      {editing && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-info-border bg-info-surface px-3.5 py-3">
          <div className="min-w-[180px] flex-1 text-xs leading-snug text-ink">
            <Icon name="info" size={14} className="mr-1 text-info" />
            Reducing items records a partial refund for the removed amount.
          </div>
          <span className="text-sm text-ink-muted">
            Refund: <span className="font-bold tabular-nums text-ink-strong">{formatINR(reductionAmount)}</span>
          </span>
          <Button theme="default" variant="outline" size="sm" onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button theme="primary" size="sm" disabled={saveDisabled} onClick={onSaveEdit}>
            Save changes
          </Button>
        </div>
      )}
    </div>
  )
}
