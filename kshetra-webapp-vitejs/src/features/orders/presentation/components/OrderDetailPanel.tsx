import { useEffect, useMemo, useRef, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { Alert, Badge, Button, Checkbox, Icon, IconButton, Spinner } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import {
  useAssignOrderPoojariMutation,
  useCancelOrderBookingsMutation,
  useCancelOrderMutation,
  useCompleteOrderBookingsMutation,
} from '@/features/orders/application/queries/useOrderMutations'
import {
  useOrderDetailQuery,
  useOrderPoojarisQuery,
  useOrderReceiptQuery,
} from '@/features/orders/application/queries/useOrdersQuery'
import { orderPaymentStatusLabel } from '@/shared/order-feed/domain/order-feed'
import {
  allBookings,
  bookingsAmount,
  isCancellable,
  type OrderBooking,
  type OrderDetail,
} from '@/features/orders/domain/entities/pooja-order-detail'
import { OrderAssignPoojariModal } from '@/features/orders/presentation/components/OrderAssignPoojariModal'
import { OrderCancelBookingsBar } from '@/features/orders/presentation/components/OrderCancelBookingsBar'
import { OrderCancelCard } from '@/features/orders/presentation/components/OrderCancelCard'
import { OrderConfirmDialog } from '@/features/orders/presentation/components/OrderConfirmDialog'
import { OrderDetailField } from '@/features/orders/presentation/components/OrderDetailField'
import { OrderReceiptModal } from '@/features/orders/presentation/components/OrderReceiptModal'
import { OrderToast } from '@/features/orders/presentation/components/OrderToast'
import { formatOrderDateTime, formatOrderDay } from '@/shared/lib/format'
import { poojaStatusColor, poojaStatusLabel } from '@/features/orders/presentation/lib/orderStatus'
import { paymentStatusColor } from '@/shared/order-feed/presentation/paymentStatus'

const TOAST_MS = 3200

export interface OrderDetailPanelProps {
  orderId: number
  crumbLabel: string
  onClose: () => void
}

type ConfirmKind = 'cancel-order' | 'cancel-bookings'

interface AssignTarget {
  readonly orderLineId: number
  readonly contextLabel: string
  readonly currentPoojariId: number | null
}

function bookedViaLabel(detail: OrderDetail): string {
  if (detail.channel === 'counter') {
    const staff = detail.counter?.staffName
    return staff ? `Counter — ${staff}` : 'Counter'
  }
  if (detail.agentCode) return `Mobile app · Agent code ${detail.agentCode.name}`
  return detail.channelDisplay || 'Mobile app'
}

/**
 * The order detail page: the order in full, and the four things done from it —
 * cancel the whole order, cancel single dates, record a pooja as performed, and
 * assign or reassign its poojari.
 *
 * It owns its own query and mutations rather than taking them as props: every
 * write here answers with the whole order, so the page re-renders from one
 * response and the state that drives it has nowhere else it belongs.
 */
export function OrderDetailPanel({ orderId, crumbLabel, onClose }: OrderDetailPanelProps) {
  const can = useCan()
  const canRefund = can(PERMISSIONS.refundPoojaOrder)
  const canAssign = can(PERMISSIONS.assignPoojari)
  const canManage = can(PERMISSIONS.managePoojaOrders)

  const detailQuery = useOrderDetailQuery(orderId)
  const detail = detailQuery.data

  const cancelOrder = useCancelOrderMutation()
  const cancelBookings = useCancelOrderBookingsMutation()
  const completeBookings = useCompleteOrderBookingsMutation()
  const assignPoojari = useAssignOrderPoojariMutation()

  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(new Set())
  const [cancelReason, setCancelReason] = useState('')
  const [datesReason, setDatesReason] = useState('')
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null)
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null)
  const [assignSelectedId, setAssignSelectedId] = useState<number | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Both are second round trips, so neither is fetched until it is opened.
  const poojarisQuery = useOrderPoojarisQuery(assignTarget != null)
  const receiptQuery = useOrderReceiptQuery(receiptOpen ? orderId : null)

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  /**
   * Escape closes the panel — but only when nothing is layered over it.
   * `Modal` listens on `document` and does not stop propagation, so without
   * this guard one Escape would dismiss the dialog *and* the page behind it.
   */
  const layerOpen = confirm !== null || assignTarget !== null || receiptOpen
  useEffect(() => {
    if (layerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [layerOpen, onClose])

  function showToast(message: string) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS)
  }

  /**
   * A selection is only meaningful against the order as it now stands: once a
   * write lands, a ticked date may have just been cancelled by it.
   */
  const validSelectedIds = useMemo(() => {
    if (!detail) return new Set<number>()
    const cancellable = new Set(allBookings(detail).filter(isCancellable).map((b) => b.orderLineId))
    return new Set([...selectedIds].filter((id) => cancellable.has(id)))
  }, [detail, selectedIds])

  const selectedAmount = detail ? bookingsAmount(detail, validSelectedIds) : 0

  const writeError =
    toFailure(cancelOrder.error) ??
    toFailure(cancelBookings.error) ??
    toFailure(completeBookings.error) ??
    toFailure(assignPoojari.error)
  const detailFailure = toFailure(detailQuery.error)

  function toggleSelect(orderLineId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderLineId)) next.delete(orderLineId)
      else next.add(orderLineId)
      return next
    })
  }

  function handleCancelOrder() {
    cancelOrder.mutate(
      { orderId, reason: cancelReason.trim() },
      {
        onSuccess: (updated) => {
          setConfirm(null)
          setCancelReason('')
          setSelectedIds(new Set())
          const settlement = updated.settlement
          showToast(
            settlement?.method === 'gateway'
              ? `Order cancelled — ${formatINR(settlement.amount)} refunded through the gateway`
              : settlement?.method === 'reconciliation'
                ? `Order cancelled — ${formatINR(settlement.amount)} to be paid back at the counter`
                : 'Order cancelled — nothing was owed back',
          )
        },
      },
    )
  }

  function handleCancelBookings() {
    cancelBookings.mutate(
      { orderId, orderLineIds: [...validSelectedIds], reason: datesReason.trim() || undefined },
      {
        onSuccess: (updated) => {
          setConfirm(null)
          setSelectedIds(new Set())
          setDatesReason('')
          const settlement = updated.settlement
          showToast(
            settlement && settlement.method !== 'none'
              ? `Dates cancelled — ${formatINR(settlement.amount)} reconciled`
              : 'Dates cancelled — nothing was collected, so nothing is owed back',
          )
        },
      },
    )
  }

  function handleComplete(booking: OrderBooking) {
    completeBookings.mutate(
      { orderId, orderLineIds: [booking.orderLineId] },
      { onSuccess: () => showToast('Pooja recorded as performed') },
    )
  }

  function handleAssign() {
    if (!assignTarget || assignSelectedId == null) return
    assignPoojari.mutate(
      { orderId, orderLineIds: [assignTarget.orderLineId], poojariId: assignSelectedId },
      {
        onSuccess: () => {
          setAssignTarget(null)
          setAssignSelectedId(null)
          showToast('Poojari assigned — 24-hour window restarted')
        },
      },
    )
  }

  const anySubmitting =
    cancelOrder.isPending || cancelBookings.isPending || completeBookings.isPending || assignPoojari.isPending

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-stroke bg-card px-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover hover:text-ink-strong"
        >
          <Icon name="arrow-left" size={18} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-overline text-ink-subtle">{crumbLabel}</span>
          <span className="text-stroke-strong">/</span>
          <span className="whitespace-nowrap text-base font-semibold text-ink-strong">
            {detail ? `Order ${detail.reference}` : 'Order'}
          </span>
        </div>
        {detail?.agentCode && (
          <span
            title="Agent code applied"
            className="inline-flex h-6.5 items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.75 text-xs font-medium text-ink shadow-xs"
          >
            <Icon name="ticket" size={14} className="text-primary" />
            {detail.agentCode.name}
          </span>
        )}
        {detail && (
          <Badge color={paymentStatusColor(detail.payment.paymentStatus)}>
            {orderPaymentStatusLabel(detail.payment.paymentStatus)}
          </Badge>
        )}
        <IconButton label="Close" variant="ghost" onClick={onClose}>
          <Icon name="x" size={18} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-6 pb-14 pt-6">
          {detailFailure && <Alert type="danger">{detailFailure.message}</Alert>}
          {writeError && (
            <Alert type="danger" title="That action was not applied">
              {/* Every write here is all-or-nothing, so a failure means nothing changed. */}
              {writeError.message}
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
              {detail.awaitingCounterPayment && (
                <Alert type="info">
                  This is an agent-code booking — the devotee settles it at the counter. It is not overdue.
                </Alert>
              )}

              {detail.cancellation.cancelled && (
                <Alert type="warning">
                  Cancelled{detail.cancellation.cancelledBy ? ` by ${detail.cancellation.cancelledBy}` : ''}
                  {detail.cancellation.cancelledAt ? ` on ${formatOrderDateTime(detail.cancellation.cancelledAt)}` : ''}
                  {detail.cancellation.reason ? ` — ${detail.cancellation.reason}` : ''}
                </Alert>
              )}

              <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 flex-1 basis-80 flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Order</div>
                  <OrderDetailField label="Order reference" value={detail.reference} />
                  <OrderDetailField label="Booked on" value={formatOrderDateTime(detail.createdAt)} />
                  <OrderDetailField
                    label="Payment method"
                    value={detail.payment.paymentMethodDisplay || detail.payment.paymentMethod || '—'}
                  />
                  <OrderDetailField label="Booked via" value={bookedViaLabel(detail)} />
                  {detail.counter && <OrderDetailField label="Receipt" value={detail.counter.receiptNo} />}
                </div>

                <div className="flex min-w-0 flex-1 basis-80 flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Devotee</div>
                  <OrderDetailField label="Account holder" value={detail.customer?.name || '—'} />
                  <OrderDetailField label="Phone" value={detail.customer?.phone || '—'} />
                  <OrderDetailField
                    label="Email"
                    value={<span className="break-all">{detail.customer?.email || '—'}</span>}
                  />
                  {detail.bookedFor.length > 0 && (
                    <div className="mt-0.5 flex flex-col gap-1.75">
                      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                        Booked for
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.bookedFor.map((person) => (
                          <span
                            key={`${person.name}-${person.nakshatram}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.75 py-1 text-xs font-medium text-ink shadow-xs"
                          >
                            <Icon name="user" size={12} className="text-ink-subtle" />
                            {person.name || '—'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {detail.poojas.map((group) => (
                <div key={group.pooja.id} className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base font-semibold text-ink-strong">{group.pooja.name}</span>
                    {group.pooja.gods[0] && <span className="text-xs text-ink-subtle">{group.pooja.gods[0].name}</span>}
                    {group.pooja.specialPooja && (
                      <Badge color="maroon" size="sm">
                        Special
                      </Badge>
                    )}
                    <span className="ml-auto text-sm font-medium tabular-nums text-ink">
                      {formatINR(group.poojaTotal)}
                    </span>
                  </div>

                  {group.dates.map((date) => {
                    const day = date.specialPoojaDate ?? date.selectedDate
                    return (
                      <div
                        key={`${date.orderId}-${day}-${date.users[0]?.orderLineId ?? 'none'}`}
                        className="flex flex-col gap-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <Icon name="calendar-blank" size={14} className="text-ink-subtle" />
                          <span className="text-sm font-medium text-ink">
                            {day ? formatOrderDay(day) : 'Date not set'}
                          </span>
                          <Badge color={poojaStatusColor(date.poojaStatus)} size="sm">
                            {poojaStatusLabel(date.poojaStatus)}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          {date.users.map((booking) => {
                            const selectable = isCancellable(booking) && canRefund
                            const actionable = isCancellable(booking)
                            return (
                              <div
                                key={booking.orderLineId}
                                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-sunken px-3 py-2.5"
                              >
                                {canRefund && (
                                  <Checkbox
                                    size="sm"
                                    checked={validSelectedIds.has(booking.orderLineId)}
                                    disabled={!selectable || anySubmitting}
                                    onChange={() => toggleSelect(booking.orderLineId)}
                                    aria-label={`Select ${booking.devotee.name || 'booking'} for cancellation`}
                                  />
                                )}

                                <span className="min-w-0 flex-1 basis-36 truncate text-sm font-medium text-ink-strong">
                                  {booking.devotee.name || '—'}
                                  {booking.devotee.nakshatram && (
                                    <span className="ml-1.5 text-xs font-normal text-ink-subtle">
                                      {booking.devotee.nakshatram}
                                    </span>
                                  )}
                                </span>

                                <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                                  <Icon name="user" size={13} className="text-ink-subtle" />
                                  {booking.poojari ? booking.poojari.name : <span className="text-ink-subtle">Unassigned</span>}
                                </span>

                                {booking.isOverdue && (
                                  <Badge color="red" size="sm">
                                    Overdue
                                  </Badge>
                                )}

                                <Badge color={poojaStatusColor(booking.poojaStatus)} size="sm">
                                  {poojaStatusLabel(booking.poojaStatus)}
                                </Badge>

                                <span className="text-sm font-medium tabular-nums text-ink">
                                  {formatINR(booking.price)}
                                </span>

                                <div className="ml-auto flex items-center gap-1.5">
                                  {actionable && canManage && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={anySubmitting}
                                      onClick={() => handleComplete(booking)}
                                    >
                                      Mark performed
                                    </Button>
                                  )}
                                  {actionable && canAssign && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={anySubmitting}
                                      onClick={() => {
                                        setAssignTarget({
                                          orderLineId: booking.orderLineId,
                                          contextLabel: `${group.pooja.name} · ${day ? formatOrderDay(day) : 'no date'}`,
                                          currentPoojariId: booking.poojari?.id ?? null,
                                        })
                                        setAssignSelectedId(booking.poojari?.id ?? null)
                                      }}
                                    >
                                      {booking.poojari ? 'Reassign' : 'Assign'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}

              <div className="flex flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
                <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Payment</div>
                <OrderDetailField label="Total" value={formatINR(detail.payment.total)} />
                {detail.payment.additionalCharges > 0 && (
                  <OrderDetailField label="Additional charges" value={formatINR(detail.payment.additionalCharges)} />
                )}
                <OrderDetailField label="Grand total" value={formatINR(detail.payment.grandTotal)} />
                {detail.payment.refundAmount > 0 && (
                  <OrderDetailField
                    label="Refunded via gateway"
                    value={`${formatINR(detail.payment.refundAmount)} · ${detail.payment.refundStatus}`}
                  />
                )}
                {/* Kept apart from the gateway figure on purpose: this money was
                    paid back by hand and nothing settles it automatically. */}
                {detail.payment.reconciledAmount > 0 && (
                  <OrderDetailField label="Reconciled by hand" value={formatINR(detail.payment.reconciledAmount)} />
                )}
                <OrderDetailField label="Refundable" value={formatINR(detail.payment.refundableAmount)} />
                {detail.payment.receipt && (
                  <OrderDetailField
                    label="Receipt no."
                    value={
                      <span className="inline-flex items-center gap-2.5">
                        {detail.payment.receipt.receiptNo}
                        <Button size="sm" variant="ghost" onClick={() => setReceiptOpen(true)}>
                          View receipt
                        </Button>
                      </span>
                    }
                  />
                )}
              </div>

              <OrderCancelCard
                cancellation={detail.cancellation}
                payment={detail.payment}
                reason={cancelReason}
                onReasonChange={setCancelReason}
                onAskCancel={() => setConfirm('cancel-order')}
                submitting={cancelOrder.isPending}
                canCancel={canRefund}
              />

              <OrderCancelBookingsBar
                selectedCount={validSelectedIds.size}
                selectedAmount={selectedAmount}
                reason={datesReason}
                onReasonChange={setDatesReason}
                onClear={() => setSelectedIds(new Set())}
                onAskCancel={() => setConfirm('cancel-bookings')}
                submitting={cancelBookings.isPending}
              />
            </>
          )}
        </div>
      </div>

      <OrderConfirmDialog
        open={confirm === 'cancel-order'}
        title="Cancel this order?"
        confirmLabel="Cancel order"
        danger
        submitting={cancelOrder.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={handleCancelOrder}
      >
        Every pooja still standing on this order will be called off.
        {detail && detail.cancellation.cancellableAmount > 0
          ? ` ${formatINR(detail.cancellation.cancellableAmount)} will be sent back.`
          : ' Nothing is owed back.'}{' '}
        Poojas already performed keep their money and stay completed.
      </OrderConfirmDialog>

      <OrderConfirmDialog
        open={confirm === 'cancel-bookings'}
        title={`Cancel ${validSelectedIds.size} ${validSelectedIds.size === 1 ? 'date' : 'dates'}?`}
        confirmLabel="Cancel dates"
        danger
        submitting={cancelBookings.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={handleCancelBookings}
      >
        {formatINR(selectedAmount)} will be recorded as reconciled. <strong>No refund is sent to the gateway</strong> —
        the payout is made by hand at the counter. The rest of the order carries on.
      </OrderConfirmDialog>

      <OrderAssignPoojariModal
        open={assignTarget != null}
        contextLabel={assignTarget?.contextLabel ?? ''}
        poojaris={poojarisQuery.data ?? []}
        loading={poojarisQuery.isPending}
        errorMessage={toFailure(poojarisQuery.error)?.message ?? null}
        currentPoojariId={assignTarget?.currentPoojariId ?? null}
        selectedId={assignSelectedId}
        onSelect={setAssignSelectedId}
        onClose={() => {
          setAssignTarget(null)
          setAssignSelectedId(null)
        }}
        onConfirm={handleAssign}
        submitting={assignPoojari.isPending}
      />

      <OrderReceiptModal
        open={receiptOpen}
        receipt={receiptQuery.data}
        loading={receiptQuery.isPending}
        errorMessage={toFailure(receiptQuery.error)?.message ?? null}
        onClose={() => setReceiptOpen(false)}
      />

      <OrderToast message={toast} />
    </div>
  )
}
