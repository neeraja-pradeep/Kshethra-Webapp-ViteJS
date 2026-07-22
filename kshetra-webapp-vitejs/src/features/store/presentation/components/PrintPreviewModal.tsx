import { formatINR } from '@/shared/lib/format'
import { Button, Icon, Modal } from '@/shared/ui'

import type { Category } from '@/features/store/domain/entities/category'
import type { Order } from '@/features/store/domain/entities/order'
import type { Product } from '@/features/store/domain/entities/product'
import { formatOrderDate, orderQuantity, orderTotal, resolveOrderItems } from '@/features/store/presentation/lib/storeFormat'

export type PrintKind = 'receipt' | 'address'

export interface PrintPreviewModalProps {
  open: boolean
  kind: PrintKind
  order: Order | null
  products: readonly Product[]
  categories: readonly Category[]
  templeName: string
  onClose: () => void
}

/**
 * A print-preview of the order receipt or shipping label. The browser print dialog opens over
 * this dialog's content; full print-only page isolation is out of scope for this feature.
 */
export function PrintPreviewModal({ open, kind, order, products, categories, templeName, onClose }: PrintPreviewModalProps) {
  if (!order) return null
  const items = resolveOrderItems(order, products, categories)
  const total = orderTotal(order, products)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kind === 'receipt' ? 'Receipt preview' : 'Shipping label preview'}
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button theme="primary" iconLeft={<Icon name="printer" size={15} />} onClick={() => window.print()}>
            Print
          </Button>
        </>
      }
    >
      {kind === 'receipt' ? (
        <div className="flex flex-col gap-2.5 py-1">
          <div className="border-b border-dashed border-stroke-strong pb-3 text-center">
            <div className="text-lg font-bold text-ink-strong">{templeName}</div>
            <div className="text-xs text-ink-subtle">Store receipt</div>
          </div>
          <div className="flex justify-between gap-3 border-b border-dashed border-stroke-strong py-2.5 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-ink-subtle">Order</span>
              <span className="font-semibold">{order.ref}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-xs text-ink-subtle">Date</span>
              <span className="font-medium">{formatOrderDate(order.date)}</span>
            </div>
          </div>
          <div className="pb-0.5 text-xs text-ink-muted">Customer: {order.customer ? order.customer.name : 'Walk-in'}</div>
          <div className="flex flex-col gap-1.75 border-b border-dashed border-stroke-strong py-2.5">
            {items.map((it) => (
              <div key={it.productId} className="flex items-baseline justify-between gap-2.5">
                <span className="text-sm">
                  {it.name} × {it.quantity}
                </span>
                <span className="tabular-nums text-sm font-semibold">{formatINR(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-baseline justify-between py-2.5 pb-0.5">
            <span className="text-base font-semibold">Total</span>
            <span className="tabular-nums text-xl font-bold">{formatINR(total)}</span>
          </div>
          <div className="text-xs text-ink-muted">Paid by {order.paymentMethod}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 py-1">
          <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Shipping label · {order.ref}</div>
          <div className="flex flex-col gap-0.75">
            <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">From</span>
            <span className="text-sm font-semibold text-ink-strong">{templeName}</span>
            <span className="text-xs text-ink-muted">Temple Store, Kshetra</span>
          </div>
          <div className="flex flex-col gap-1 rounded-md p-3.5 ring-1 ring-inset ring-stroke-strong">
            <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Deliver to</span>
            <span className="text-lg font-bold text-ink-strong">{order.address?.name}</span>
            <span className="text-base leading-snug text-ink">
              {order.address?.line1}, {order.address?.line2}
            </span>
            <span className="text-sm text-ink-muted">{order.address?.phone}</span>
          </div>
          <div className="text-xs text-ink-muted">
            Order {order.ref} · {orderQuantity(order)} items
          </div>
        </div>
      )}
    </Modal>
  )
}
