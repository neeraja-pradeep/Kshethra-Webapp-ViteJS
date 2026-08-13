import { Alert, Button, Textarea } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

import type { OrderCancellation, OrderPayment } from '@/features/orders/domain/entities/pooja-order-detail'

export interface OrderCancelCardProps {
  cancellation: OrderCancellation
  payment: OrderPayment
  reason: string
  onReasonChange: (value: string) => void
  onAskCancel: () => void
  submitting: boolean
  /** False when the signed-in user lacks `rbac.refund_pooja_order`. */
  canCancel: boolean
}

/**
 * Cancel the whole order.
 *
 * How the money goes back is the server's decision, not a choice offered here —
 * a Razorpay payment is refunded through the gateway, anything taken at the
 * desk is written to `reconciledAmount` for a payout by hand, and an order
 * whose money was never collected owes nothing. The card states which of those
 * will happen so the operator is not surprised by the receipt afterwards.
 */
export function OrderCancelCard(props: OrderCancelCardProps) {
  const { cancellation, payment } = props

  if (cancellation.cancelled) return null

  if (!props.canCancel) {
    return (
      <div className="flex flex-col gap-2.5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Cancel order</div>
        <p className="m-0 text-sm text-ink-muted">
          You do not have permission to cancel orders or issue refunds.
        </p>
      </div>
    )
  }

  const amount = cancellation.cancellableAmount
  // Razorpay is the only route back through the gateway; everything else was
  // taken at the desk and has to be handed back there too.
  const viaGateway = payment.paymentMethod === 'razorpay'

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Cancel order</div>

      {!cancellation.canCancel ? (
        <p className="m-0 text-sm text-ink-muted">This order can no longer be cancelled.</p>
      ) : (
        <>
          {amount > 0 ? (
            <Alert type={viaGateway ? 'info' : 'warning'}>
              {viaGateway
                ? `${formatINR(amount)} will be refunded through the payment gateway now.`
                : `${formatINR(amount)} will be recorded as reconciled — the payout has to be made by hand at the counter.`}
            </Alert>
          ) : (
            <Alert type="info">
              This order owes nothing back — either the money was never collected, or every pooja on it has already
              been performed. It can still be cancelled.
            </Alert>
          )}

          <Textarea
            label="Reason"
            placeholder="Why is this order being cancelled?"
            value={props.reason}
            onChange={(e) => props.onReasonChange(e.target.value)}
            rows={3}
          />
          {/* The server requires it, and it is copied onto every booking the
              cancellation calls off — so the button stays shut until it is given. */}
          <div className="flex justify-end">
            <Button
              theme="danger"
              onClick={props.onAskCancel}
              disabled={!props.reason.trim() || props.submitting}
              loading={props.submitting}
            >
              Cancel order
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
