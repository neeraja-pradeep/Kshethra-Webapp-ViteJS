import { Badge, Icon } from '@/shared/ui'
import type { Order } from '@/features/orders/domain/entities/order'
import { orderTotal } from '@/features/orders/presentation/lib/orderRollup'
import { paymentStatusColor } from '@/features/orders/presentation/lib/statusColors'
import type { OccurrenceActionKind } from '@/features/orders/presentation/lib/occurrenceStatus'
import { OrderOverviewCards } from '@/features/orders/presentation/components/OrderOverviewCards'
import { OrderPoojaSection } from '@/features/orders/presentation/components/OrderPoojaSection'
import { OrderPaymentSummaryCard } from '@/features/orders/presentation/components/OrderPaymentSummaryCard'
import { OrderCancellationCard } from '@/features/orders/presentation/components/OrderCancellationCard'
import { OrderRefundLogCard } from '@/features/orders/presentation/components/OrderRefundLogCard'

export interface OrderDetailDrawerProps {
  order: Order
  crumbLabel: string
  todayIso: string
  onClose: () => void

  selectedOccurrenceIds: ReadonlySet<string>
  onToggleSelect: (occurrenceId: string) => void
  onOccurrenceAction: (occurrenceId: string, kind: OccurrenceActionKind) => void

  cancelBlocked: boolean
  cancelReason: string
  onCancelReasonChange: (value: string) => void
  cancelDisabled: boolean
  onAskCancelOrder: () => void

  hasSelection: boolean
  selectedCount: number
  selectedAmountLabel: string
  partialAmount: string
  onPartialAmountChange: (value: string) => void
  partialReason: string
  onPartialReasonChange: (value: string) => void
  partialDisabled: boolean
  onAskPartialRefund: () => void

  onViewReceipt: () => void
}

/** The order-detail right slide-over: header, order/devotee cards, per-pooja sections, payment + cancellation. */
export function OrderDetailDrawer(props: OrderDetailDrawerProps) {
  const { order } = props
  const total = orderTotal(order)

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-stroke bg-card px-6">
        <button
          type="button"
          onClick={props.onClose}
          aria-label="Back"
          className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover hover:text-ink-strong"
        >
          <Icon name="arrow-left" size={18} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-overline text-ink-subtle">{props.crumbLabel}</span>
          <span className="text-stroke-strong">/</span>
          <span className="whitespace-nowrap text-base font-semibold text-ink-strong">Order {order.ref}</span>
        </div>
        {order.agentCode && (
          <span title="Agent code applied" className="inline-flex h-6.5 items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.75 text-xs font-medium text-ink shadow-xs">
            <Icon name="ticket" size={14} className="text-primary" />
            {order.agentCode}
          </span>
        )}
        <Badge color={paymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-6 pb-14 pt-6">
          <OrderOverviewCards order={order} />

          {order.lineItems.map((item) => (
            <OrderPoojaSection
              key={`${item.poojaName}-${item.godName}`}
              item={item}
              todayIso={props.todayIso}
              selectedOccurrenceIds={props.selectedOccurrenceIds}
              onToggleSelect={props.onToggleSelect}
              onOccurrenceAction={props.onOccurrenceAction}
            />
          ))}

          <div className="flex flex-col gap-4">
            <OrderPaymentSummaryCard total={total} receiptRef={order.receiptRef} onViewReceipt={props.onViewReceipt} />
            <OrderCancellationCard
              cancelBlocked={props.cancelBlocked}
              cancelReason={props.cancelReason}
              onCancelReasonChange={props.onCancelReasonChange}
              cancelDisabled={props.cancelDisabled}
              onAskCancelOrder={props.onAskCancelOrder}
              hasSelection={props.hasSelection}
              selectedCount={props.selectedCount}
              selectedAmountLabel={props.selectedAmountLabel}
              partialAmount={props.partialAmount}
              onPartialAmountChange={props.onPartialAmountChange}
              partialReason={props.partialReason}
              onPartialReasonChange={props.onPartialReasonChange}
              partialDisabled={props.partialDisabled}
              onAskPartialRefund={props.onAskPartialRefund}
            />
          </div>

          <OrderRefundLogCard entries={order.refundLog} />
        </div>
      </div>
    </div>
  )
}
