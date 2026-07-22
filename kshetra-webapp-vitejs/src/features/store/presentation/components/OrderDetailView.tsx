import { useEffect, useMemo, useState } from 'react'

import { formatINR } from '@/shared/lib/format'
import { Badge, Icon } from '@/shared/ui'

import type { Category } from '@/features/store/domain/entities/category'
import { FULFILMENT_STAGES, type FulfilmentStage, type Order, type OrderLineItem } from '@/features/store/domain/entities/order'
import type { Product } from '@/features/store/domain/entities/product'
import {
  ACTING_USER,
  formatOrderDate,
  fulfilmentBadgeColor,
  isRefundResolved,
  orderTotal,
  paymentBadgeColor,
  resolveOrderItems,
} from '@/features/store/presentation/lib/storeFormat'

import { ConfirmDialog } from './ConfirmDialog'
import { DetailTopBar } from './DetailTopBar'
import { OrderFulfilmentPanel } from './OrderFulfilmentPanel'
import { OrderItemsPanel } from './OrderItemsPanel'
import { OrderPaymentSummaryPanel } from './OrderPaymentSummaryPanel'
import { OrderRefundPanel } from './OrderRefundPanel'
import { OverlineField, SectionLabel } from './OverlineField'

interface EditDraftLine {
  productId: string
  qty: number
  orig: number
}

type ConfirmKind = 'edit-items' | 'full-refund' | 'partial-refund'

export interface OrderDetailViewProps {
  order: Order
  products: readonly Product[]
  categories: readonly Category[]
  onClose: () => void
  onSetFulfilment: (ref: string, stage: FulfilmentStage) => void
  onApplyItemEdits: (ref: string, items: OrderLineItem[], refundAmount: number) => void
  onFullRefund: (ref: string, reason: string) => void
  onPartialRefund: (ref: string, amount: number, reason: string) => void
  onPrintReceipt: (order: Order) => void
  onPrintAddress: (order: Order) => void
}

/** Full-screen order detail overlay: order/customer info, fulfilment, items, payment & refunds. */
export function OrderDetailView({
  order,
  products,
  categories,
  onClose,
  onSetFulfilment,
  onApplyItemEdits,
  onFullRefund,
  onPartialRefund,
  onPrintReceipt,
  onPrintAddress,
}: OrderDetailViewProps) {
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<EditDraftLine[] | null>(null)
  const [fullReason, setFullReason] = useState('')
  const [partialSel, setPartialSel] = useState<Record<string, boolean>>({})
  const [partialAmount, setPartialAmount] = useState('')
  const [partialReason, setPartialReason] = useState('')
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; title: string; body: string; actionLabel: string; danger: boolean } | null>(null)

  // Reset all transient view state whenever a different order is opened.
  useEffect(() => {
    setEditing(false)
    setEditDraft(null)
    setFullReason('')
    setPartialSel({})
    setPartialAmount('')
    setPartialReason('')
    setConfirm(null)
  }, [order.ref])

  const items = useMemo(() => resolveOrderItems(order, products, categories), [order, products, categories])
  const total = useMemo(() => orderTotal(order, products), [order, products])
  const resolved = isRefundResolved(order)
  const canFullRefund = order.paymentStatus === 'Paid' && (order.fulfilmentStatus === 'Processing' || order.fulfilmentStatus === 'Packed')
  const showPartial = !resolved && (order.fulfilmentStatus === 'Shipped' || order.fulfilmentStatus === 'Delivered' || order.paymentStatus === 'Partially Refunded')

  const draftById = useMemo(() => {
    const map = new Map<string, EditDraftLine>()
    ;(editDraft ?? []).forEach((d) => map.set(d.productId, d))
    return map
  }, [editDraft])

  const displayedItems = items.map((it) => {
    const d = draftById.get(it.productId)
    const qty = editing && d ? d.qty : it.quantity
    return { productId: it.productId, name: it.name, category: it.category, qty, unitPrice: it.unitPrice, lineTotal: it.unitPrice * qty }
  })

  const reductionAmount = (editDraft ?? []).reduce((sum, d) => {
    const line = items.find((it) => it.productId === d.productId)
    return sum + (line?.unitPrice ?? 0) * (d.orig - d.qty)
  }, 0)

  const selCount = Object.values(partialSel).filter(Boolean).length
  const partialAmt = parseInt(partialAmount, 10) || 0
  const partialOk = partialAmt > 0 && partialReason.trim().length > 0
  const partialCaptureNote = `${selCount ? `${selCount} item${selCount === 1 ? '' : 's'} · ` : ''}recorded as ${ACTING_USER}`

  const handleToggleEdit = () => {
    if (editing) {
      setEditing(false)
      setEditDraft(null)
      return
    }
    setEditDraft(items.map((it) => ({ productId: it.productId, qty: it.quantity, orig: it.quantity })))
    setEditing(true)
  }
  const handleDec = (productId: string) => setEditDraft((d) => (d ? d.map((x) => (x.productId === productId ? { ...x, qty: Math.max(0, x.qty - 1) } : x)) : d))
  const handleInc = (productId: string) =>
    setEditDraft((d) => (d ? d.map((x) => (x.productId === productId ? { ...x, qty: Math.min(x.orig, x.qty + 1) } : x)) : d))

  const askSaveEdit = () => {
    if (reductionAmount > 0) {
      setConfirm({
        kind: 'edit-items',
        title: 'Save item changes?',
        body: `Reduced items lower the order total by ${formatINR(reductionAmount)} and record a partial refund for reconciliation.`,
        actionLabel: 'Save & record refund',
        danger: false,
      })
    } else {
      setEditing(false)
      setEditDraft(null)
    }
  }

  const askFullRefund = () =>
    setConfirm({
      kind: 'full-refund',
      title: 'Cancel & refund fully?',
      body: 'The order will be cancelled and the full amount auto-refunded through the payment gateway. This can’t be undone.',
      actionLabel: 'Refund & cancel',
      danger: true,
    })

  const askPartialRefund = () =>
    setConfirm({
      kind: 'partial-refund',
      title: 'Record partial refund?',
      body: 'A refund will be logged for reconciliation and payment marked partially refunded. The payout happens externally — this does not move money.',
      actionLabel: 'Record refund',
      danger: false,
    })

  const handleConfirmYes = () => {
    if (!confirm) return
    if (confirm.kind === 'edit-items' && editDraft) {
      const newItems: OrderLineItem[] = editDraft.filter((d) => d.qty > 0).map((d) => ({ productId: d.productId, quantity: d.qty }))
      onApplyItemEdits(order.ref, newItems, reductionAmount)
      setEditing(false)
      setEditDraft(null)
    } else if (confirm.kind === 'full-refund') {
      onFullRefund(order.ref, fullReason.trim())
      setFullReason('')
    } else if (confirm.kind === 'partial-refund') {
      onPartialRefund(order.ref, partialAmt, partialReason.trim())
      setPartialSel({})
      setPartialAmount('')
      setPartialReason('')
    }
    setConfirm(null)
  }

  const togglePartialItem = (productId: string) => {
    setPartialSel((sel) => {
      const next = { ...sel }
      if (next[productId]) delete next[productId]
      else next[productId] = true
      const sum = items.filter((it) => next[it.productId]).reduce((a, it) => a + it.lineTotal, 0)
      setPartialAmount(sum ? String(sum) : '')
      return next
    })
  }

  // Escape closes the topmost layer: the confirm modal handles itself; otherwise this screen backs out.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || confirm) return
      onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DetailTopBar
        section="Store · Orders"
        title={order.ref}
        onBack={onClose}
        badges={
          <>
            <Badge size="sm" color={fulfilmentBadgeColor(order.fulfilmentStatus)}>
              {order.fulfilmentStatus}
            </Badge>
            <Badge size="sm" color={paymentBadgeColor(order.paymentStatus)}>
              {order.paymentStatus}
            </Badge>
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-4 px-6 pb-14 pt-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex min-w-0 flex-1 basis-[300px] flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
              <SectionLabel>Order</SectionLabel>
              <OverlineField label="Order reference" value={order.ref} />
              <OverlineField label="Placed on" value={formatOrderDate(order.date)} alignValue="right" />
              <OverlineField label="Payment method" value={order.paymentMethod} />
            </div>
            <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
              <SectionLabel>Customer</SectionLabel>
              <OverlineField
                label={order.customer ? 'Account holder' : 'Customer'}
                value={order.customer ? order.customer.name : 'Walk-in'}
                alignValue="right"
              />
              {order.customer && (
                <>
                  <OverlineField label="Phone" value={order.customer.phone} />
                  <OverlineField label="Email" value={<span className="break-all">{order.customer.email}</span>} alignValue="right" />
                </>
              )}
              {order.address && (
                <div className="mt-0.5 flex flex-col gap-1 border-t border-stroke-subtle pt-3">
                  <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Delivery address</span>
                  <span className="text-sm font-medium text-ink-strong">{order.address.name}</span>
                  <span className="text-sm leading-snug text-ink">
                    {order.address.line1}, {order.address.line2}
                  </span>
                  <span className="text-sm text-ink-muted">{order.address.phone}</span>
                </div>
              )}
              {!order.customer && !order.address && (
                <div className="flex items-start gap-2 rounded-md bg-sunken px-2.75 py-2.25 text-xs leading-snug text-ink-subtle">
                  <Icon name="storefront" size={15} className="mt-px flex-shrink-0 text-ink-muted" />
                  Walk-in counter sale — collected at the counter, no delivery.
                </div>
              )}
            </div>
          </div>

          <OrderFulfilmentPanel
            stage={order.fulfilmentStatus}
            onAdvance={() => {
              const idx = FULFILMENT_STAGES.indexOf(order.fulfilmentStatus)
              if (idx >= 0 && idx < FULFILMENT_STAGES.length - 1) onSetFulfilment(order.ref, FULFILMENT_STAGES[idx + 1])
            }}
            onSetStage={(stage) => onSetFulfilment(order.ref, stage)}
          />

          <OrderItemsPanel
            items={displayedItems}
            editing={editing}
            canEdit={!resolved}
            reductionAmount={reductionAmount}
            saveDisabled={reductionAmount <= 0}
            isIncDisabled={(productId) => {
              const d = draftById.get(productId)
              return d ? d.qty >= d.orig : true
            }}
            onToggleEdit={handleToggleEdit}
            onDec={handleDec}
            onInc={handleInc}
            onCancelEdit={handleToggleEdit}
            onSaveEdit={askSaveEdit}
          />

          <div className="flex flex-wrap items-start gap-4">
            <OrderPaymentSummaryPanel
              total={total}
              receiptRef={order.receiptRef}
              hasAddress={!!order.address}
              refundLog={order.refundLog}
              onPrintReceipt={() => onPrintReceipt(order)}
              onPrintAddress={() => onPrintAddress(order)}
            />
            <OrderRefundPanel
              resolved={resolved}
              resolvedNote={order.paymentStatus === 'Refunded' ? 'This order was fully refunded and cancelled.' : 'This order is closed for refunds.'}
              showFull={!resolved && canFullRefund}
              fullReason={fullReason}
              fullDisabled={!fullReason.trim()}
              onFullReasonChange={setFullReason}
              onAskFullRefund={askFullRefund}
              showPartial={showPartial}
              refundItems={items.map((it) => ({ productId: it.productId, name: it.name, qty: it.quantity, lineTotal: it.lineTotal, selected: !!partialSel[it.productId] }))}
              onToggleRefundItem={togglePartialItem}
              partialAmount={partialAmount}
              onPartialAmountChange={setPartialAmount}
              partialReason={partialReason}
              onPartialReasonChange={setPartialReason}
              partialCaptureNote={partialCaptureNote}
              partialDisabled={!partialOk}
              onAskPartialRefund={askPartialRefund}
            />
          </div>

          <div className="pt-1 text-center text-xs text-ink-disabled">Orders are financial records and can&rsquo;t be deleted.</div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        body={confirm?.body ?? ''}
        confirmLabel={confirm?.actionLabel ?? 'Confirm'}
        danger={confirm?.danger ?? true}
        onConfirm={handleConfirmYes}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
