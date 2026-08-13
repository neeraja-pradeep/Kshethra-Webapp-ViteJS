import { useEffect, useRef, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { cn } from '@/shared/lib/cn'
import { formatINR, formatOrderDateTime } from '@/shared/lib/format'
import { Alert, Badge, Button, Icon, IconButton, Input, Spinner, Textarea } from '@/shared/ui'
import { orderPaymentStatusLabel } from '@/shared/order-feed/domain/order-feed'
import { paymentStatusColor } from '@/shared/order-feed/presentation/paymentStatus'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import {
  useCancelStoreOrderMutation,
  useRefundStoreOrderMutation,
  useSetFulfilmentMutation,
} from '@/features/store/application/queries/useStoreOrderMutations'
import {
  useStoreOrderQuery,
  useStoreOrderReceiptQuery,
} from '@/features/store/application/queries/useStoreOrderQueries'
import {
  FULFILMENT_FLOW,
  canRefund,
  fulfilmentLabel,
  offerableNextStatuses,
  type StoreOrderDetail,
} from '@/features/store/domain/entities/store-order'

import { ConfirmDialog } from './ConfirmDialog'
import { StoreReceiptModal } from './StoreReceiptModal'
import { ToastMessage } from './ToastMessage'

const TOAST_MS = 3200

export interface StoreOrderDetailPanelProps {
  orderId: number
  onClose: () => void
}

type ConfirmKind = 'cancel' | 'refund'

/**
 * One shop order, and everything the back office does to it.
 *
 * The fulfilment flow is **never encoded here**: the payload reports
 * `fulfilment.nextStatuses`, read from the same table the endpoint checks
 * against, so the buttons are built from it. The old screen offered all four
 * stages as free buttons, which let a parcel be marked delivered without ever
 * having been packed — and let it move backwards.
 */
export function StoreOrderDetailPanel({ orderId, onClose }: StoreOrderDetailPanelProps) {
  const can = useCan()
  const canFulfil = can(PERMISSIONS.changeEcommerceOrder)
  const canRefundOrder = can(PERMISSIONS.refundEcommerceOrder)

  const detailQuery = useStoreOrderQuery(orderId)
  const detail = detailQuery.data
  const setFulfilment = useSetFulfilmentMutation()
  const cancelOrder = useCancelStoreOrderMutation()
  const refundOrder = useRefundStoreOrderMutation()

  const [cancelReason, setCancelReason] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const receiptQuery = useStoreOrderReceiptQuery(receiptOpen ? orderId : null)

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const showToast = (message: string) => {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_MS)
  }

  // Escape backs out — but only when nothing is layered over the page.
  const layerOpen = confirm !== null || receiptOpen
  useEffect(() => {
    if (layerOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [layerOpen, onClose])

  const writeFailure =
    toFailure(setFulfilment.error) ?? toFailure(cancelOrder.error) ?? toFailure(refundOrder.error)
  const detailFailure = toFailure(detailQuery.error)
  const busy = setFulfilment.isPending || cancelOrder.isPending || refundOrder.isPending

  const refundable = detail?.payment.refundableAmount ?? 0
  const typedRefund = refundAmount === '' ? refundable : Number(refundAmount)
  const refundTooBig = typedRefund > refundable
  const refundValid = refundReason.trim() !== '' && typedRefund > 0 && !refundTooBig

  function handleCancel() {
    cancelOrder.mutate(
      { orderId, reason: cancelReason.trim() },
      {
        onSuccess: (updated: StoreOrderDetail) => {
          setConfirm(null)
          setCancelReason('')
          const s = updated.settlement
          const money =
            s?.method === 'gateway'
              ? `${formatINR(s.amount)} refunded through the gateway`
              : s?.method === 'counter'
                ? `${formatINR(s.amount)} to be handed back at the counter`
                : 'nothing was owed back'
          showToast(`Order cancelled — ${money}${updated.restocked ? ', stock returned' : ''}`)
        },
      },
    )
  }

  function handleRefund() {
    refundOrder.mutate(
      {
        orderId,
        reason: refundReason.trim(),
        // Omitting the amount sends back the whole remainder.
        ...(refundAmount === '' ? {} : { amount: Number(refundAmount) }),
      },
      {
        onSuccess: (updated: StoreOrderDetail) => {
          setConfirm(null)
          setRefundReason('')
          setRefundAmount('')
          showToast(
            `Refunded ${formatINR(updated.settlement?.amount ?? 0)} — ${formatINR(updated.payment.refundableAmount)} left`,
          )
        },
      },
    )
  }

  const flowIndex = detail ? FULFILMENT_FLOW.indexOf(detail.fulfilment.status) : -1

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-stroke bg-card px-6">
        <IconButton label="Back" variant="ghost" onClick={onClose}>
          <Icon name="arrow-left" size={18} />
        </IconButton>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-overline text-ink-subtle">Store · Orders</span>
          <span className="text-stroke-strong">/</span>
          <span className="whitespace-nowrap text-base font-semibold text-ink-strong">
            {detail ? detail.reference : 'Order'}
          </span>
        </div>
        {detail && (
          <>
            <Badge color={paymentStatusColor(detail.payment.paymentStatus)}>
              {orderPaymentStatusLabel(detail.payment.paymentStatus)}
            </Badge>
            <Badge color={detail.fulfilment.status === 'cancelled' ? 'red' : 'gray'}>
              {detail.fulfilment.statusDisplay || fulfilmentLabel(detail.fulfilment.status)}
            </Badge>
          </>
        )}
        <IconButton label="Close" variant="ghost" onClick={onClose}>
          <Icon name="x" size={18} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-4 px-6 pb-14 pt-6">
          {detailFailure && <Alert type="danger">{detailFailure.message}</Alert>}
          {writeFailure && (
            <Alert type="danger" title="That action was not applied">
              {writeFailure.message}
            </Alert>
          )}

          {detailQuery.isPending && (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-ink-subtle">
              <Spinner size={28} />
              <span className="text-sm">Loading order…</span>
            </div>
          )}

          {detail && (
            <>
              {detail.cancellation.cancelled && (
                <Alert type="warning">
                  Cancelled{detail.cancellation.cancelledBy ? ` by ${detail.cancellation.cancelledBy}` : ''}
                  {detail.cancellation.cancelledAt ? ` on ${formatOrderDateTime(detail.cancellation.cancelledAt)}` : ''}
                  {detail.cancellation.reason ? ` — ${detail.cancellation.reason}` : ''}
                </Alert>
              )}

              {/* Fulfilment: a read-only rail plus buttons built from the server's own list. */}
              <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
                <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Fulfilment</div>

                {detail.fulfilment.status === 'cancelled' ? (
                  <div className="text-sm text-ink-muted">This order was cancelled.</div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {FULFILMENT_FLOW.map((stage, index) => (
                      <span
                        key={stage}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.75 py-1 text-xs font-medium',
                          index < flowIndex
                            ? 'bg-success-surface text-success-strong'
                            : index === flowIndex
                              ? 'bg-primary text-white'
                              : 'bg-sunken text-ink-subtle',
                        )}
                      >
                        {index < flowIndex && <Icon name="check" size={12} />}
                        {fulfilmentLabel(stage)}
                      </span>
                    ))}
                  </div>
                )}

                {canFulfil && offerableNextStatuses(detail.fulfilment).length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-ink-subtle">Move to:</span>
                    {offerableNextStatuses(detail.fulfilment).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        theme="primary"
                        variant="subtle"
                        disabled={busy}
                        onClick={() =>
                          setFulfilment.mutate(
                            { orderId, status },
                            { onSuccess: () => showToast(`Marked ${fulfilmentLabel(status).toLowerCase()}`) },
                          )
                        }
                      >
                        {fulfilmentLabel(status)}
                      </Button>
                    ))}
                  </div>
                )}
                {detail.fulfilment.status === 'delivered' && (
                  <div className="text-2xs text-ink-subtle">
                    Delivered is the end of the flow — an order already with the customer is put right with a refund,
                    not by cancelling a handover that happened.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 flex-1 basis-80 flex-col gap-2.5 rounded-2xl bg-card p-5 shadow-sm">
                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Customer</div>
                  <div className="text-sm font-medium text-ink-strong">{detail.customer?.name || 'Walk-in'}</div>
                  {detail.customer?.phone && <div className="text-sm text-ink-muted">{detail.customer.phone}</div>}
                  {detail.customer?.email && (
                    <div className="break-all text-sm text-ink-muted">{detail.customer.email}</div>
                  )}
                  <div className="mt-1 text-xs text-ink-subtle">
                    {detail.channelDisplay || detail.channel}
                    {detail.counter?.staffName ? ` · ${detail.counter.staffName}` : ''}
                    {detail.createdAt ? ` · ${formatOrderDateTime(detail.createdAt)}` : ''}
                  </div>
                </div>

                {detail.shippingAddress && (
                  <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1 rounded-2xl bg-card p-5 shadow-sm">
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                      Shipping address
                    </div>
                    <div className="text-sm text-ink">{detail.shippingAddress.name}</div>
                    <div className="text-sm text-ink-muted">
                      {[detail.shippingAddress.line1, detail.shippingAddress.line2].filter(Boolean).join(', ')}
                    </div>
                    <div className="text-sm text-ink-muted">
                      {[detail.shippingAddress.city, detail.shippingAddress.state, detail.shippingAddress.pincode]
                        .filter(Boolean)
                        .join(' ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Read-only: nothing rewrites an order's lines. */}
              <div className="flex flex-col gap-2 rounded-2xl bg-card p-5 shadow-sm">
                <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                  Items · {detail.itemCount} {detail.itemCount === 1 ? 'unit' : 'units'}
                </div>
                {detail.items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-sunken px-3 py-2.5">
                    {item.imageUrl && (
                      <span
                        className="h-9 w-9 flex-shrink-0 rounded-md bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                        role="presentation"
                      />
                    )}
                    <div className="min-w-0 flex-1 basis-48">
                      <div className="truncate text-sm font-medium text-ink-strong">{item.name}</div>
                      {item.sku && <div className="font-mono text-2xs text-ink-subtle">{item.sku}</div>}
                    </div>
                    <span className="text-sm tabular-nums text-ink-muted">
                      {item.quantity} × {formatINR(item.unitPrice)}
                    </span>
                    <span className="ml-auto text-sm font-medium tabular-nums text-ink">{formatINR(item.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2.5 rounded-2xl bg-card p-5 shadow-sm">
                <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Payment</div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Total charged</span>
                  <span className="font-medium tabular-nums text-ink-strong">{formatINR(detail.payment.total)}</span>
                </div>
                {detail.payment.refundAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted">Refunded ({detail.payment.refundStatus})</span>
                    <span className="tabular-nums text-ink">−{formatINR(detail.payment.refundAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Left to refund</span>
                  <span className="tabular-nums text-ink">{formatINR(detail.payment.refundableAmount)}</span>
                </div>
                {detail.payment.receipt && (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-sm text-ink-muted">
                      Receipt <span className="font-mono text-xs">{detail.payment.receipt.receiptNo}</span>
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setReceiptOpen(true)}>
                      View receipt
                    </Button>
                  </div>
                )}
              </div>

              {canRefundOrder && !detail.cancellation.cancelled && detail.cancellation.canCancel && (
                <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                    Cancel order
                  </div>
                  <Alert type="info">
                    {formatINR(detail.cancellation.cancellableAmount)} will be settled the way it was taken. Anything
                    not yet shipped goes back on the shelf.
                  </Alert>
                  <Textarea
                    label="Reason"
                    placeholder="Why is this order being cancelled?"
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      theme="danger"
                      disabled={!cancelReason.trim() || busy}
                      loading={cancelOrder.isPending}
                      onClick={() => setConfirm('cancel')}
                    >
                      Cancel order
                    </Button>
                  </div>
                </div>
              )}

              {canRefundOrder && canRefund(detail.payment) && !detail.cancellation.cancelled && (
                <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Refund</div>
                  {/* Refunds accumulate; the cap is what is LEFT, not the order total. */}
                  <div className="text-xs text-ink-subtle">
                    Sends money back without calling the order off. Up to{' '}
                    {formatINR(detail.payment.refundableAmount)} remains.
                  </div>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="w-[180px]">
                      <Input
                        label="Amount (₹)"
                        type="number"
                        step="0.01"
                        min={0}
                        max={detail.payment.refundableAmount}
                        placeholder={String(detail.payment.refundableAmount)}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        error={refundTooBig ? `Only ${formatINR(refundable)} is left to refund.` : undefined}
                        hint="Leave blank to refund the remainder."
                      />
                    </div>
                    <div className="min-w-[200px] flex-1">
                      <Input
                        label="Reason"
                        required
                        placeholder="e.g. Damaged diya"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      theme="danger"
                      variant="outline"
                      disabled={!refundValid || busy}
                      loading={refundOrder.isPending}
                      onClick={() => setConfirm('refund')}
                    >
                      Refund {formatINR(typedRefund || 0)}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Cancel this order?"
        body={
          detail
            ? `${formatINR(detail.cancellation.cancellableAmount)} will be sent back the way it was paid, and anything not yet shipped returns to stock. This cannot be undone.`
            : ''
        }
        confirmLabel="Cancel order"
        onCancel={() => setConfirm(null)}
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        open={confirm === 'refund'}
        title={`Refund ${formatINR(typedRefund || 0)}?`}
        body="The order stays as it is — only the money goes back. Refunds accumulate against what is left."
        confirmLabel="Send refund"
        onCancel={() => setConfirm(null)}
        onConfirm={handleRefund}
      />

      <StoreReceiptModal
        open={receiptOpen}
        receipt={receiptQuery.data}
        loading={receiptQuery.isPending}
        errorMessage={toFailure(receiptQuery.error)?.message ?? null}
        onClose={() => setReceiptOpen(false)}
      />

      <ToastMessage show={toast.show} message={toast.message} />
    </div>
  )
}
