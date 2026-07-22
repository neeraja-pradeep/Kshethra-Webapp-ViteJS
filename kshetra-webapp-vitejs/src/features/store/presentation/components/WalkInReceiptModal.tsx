import { formatINR } from '@/shared/lib/format'
import { Button, Icon } from '@/shared/ui'

import type { Category } from '@/features/store/domain/entities/category'
import type { Order } from '@/features/store/domain/entities/order'
import type { Product } from '@/features/store/domain/entities/product'
import { resolveOrderItems } from '@/features/store/presentation/lib/storeFormat'

export interface WalkInReceiptModalProps {
  order: Order | null
  products: readonly Product[]
  categories: readonly Category[]
  templeName: string
  onDone: () => void
  onNewSale: () => void
  onPrint: () => void
}

/** Printable receipt shown right after a walk-in sale is confirmed. No overlay-click / Escape dismiss. */
export function WalkInReceiptModal({ order, products, categories, templeName, onDone, onNewSale, onPrint }: WalkInReceiptModalProps) {
  if (!order) return null
  const items = resolveOrderItems(order, products, categories)
  const total = items.reduce((sum, it) => sum + it.lineTotal, 0)

  return (
    <div className="fixed inset-0 z-menu flex items-center justify-center overflow-auto bg-overlay p-6 [backdrop-filter:blur(2px)]">
      <div className="m-auto flex flex-col items-center gap-4">
        <div className="flex w-[340px] flex-col rounded-xl bg-card p-6 px-6.5 shadow-xl">
          <div className="border-b border-dashed border-stroke-strong pb-3.25 text-center">
            <span className="inline-flex h-9.5 w-9.5 items-center justify-center rounded-lg bg-primary text-[22px] font-black leading-none text-white">
              क
            </span>
            <div className="mt-2 text-lg font-bold text-ink-strong">{templeName}</div>
            <div className="mt-0.5 text-xs text-ink-subtle">Store receipt · Walk-in</div>
          </div>
          <div className="flex justify-between gap-3 border-b border-dashed border-stroke-strong py-2.75 text-sm">
            <div className="flex flex-col gap-0.75">
              <span className="text-xs text-ink-subtle">Order</span>
              <span className="font-semibold text-ink-strong">{order.ref}</span>
            </div>
            <div className="flex flex-col gap-0.75 text-right">
              <span className="text-xs text-ink-subtle">Customer</span>
              <span className="font-medium text-ink-strong">{order.walkinName || 'Walk-in'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.25 border-b border-dashed border-stroke-strong py-3">
            {items.map((it) => (
              <div key={it.productId} className="flex items-baseline justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-strong">{it.name}</div>
                  <div className="tabular-nums text-xs text-ink-subtle">
                    {it.quantity} × {formatINR(it.unitPrice)}
                  </div>
                </div>
                <span className="whitespace-nowrap tabular-nums text-sm font-semibold text-ink-strong">{formatINR(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-baseline justify-between py-3 pb-1">
            <span className="text-base font-semibold text-ink-strong">Total paid</span>
            <span className="tabular-nums text-2xl font-bold text-ink-strong">{formatINR(total)}</span>
          </div>
          <div className="pt-1.5 text-xs text-ink-muted">Paid by {order.paymentMethod} · Delivered at counter</div>
          <div className="mt-3.25 text-center text-xs italic text-ink-subtle">Thank you · शुभमस्तु</div>
        </div>
        <div className="flex gap-2.5">
          <Button theme="default" variant="outline" onClick={onDone}>
            Done
          </Button>
          <Button theme="default" variant="outline" onClick={onNewSale}>
            New sale
          </Button>
          <Button theme="primary" iconLeft={<Icon name="printer" size={16} />} onClick={onPrint}>
            Print receipt
          </Button>
        </div>
      </div>
    </div>
  )
}
