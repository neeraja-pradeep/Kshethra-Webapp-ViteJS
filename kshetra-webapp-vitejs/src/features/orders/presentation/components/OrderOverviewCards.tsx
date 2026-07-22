import { Icon } from '@/shared/ui'
import type { Order } from '@/features/orders/domain/entities/order'
import { OrderDetailField } from '@/features/orders/presentation/components/OrderDetailField'
import { orderFamilyMembers } from '@/features/orders/presentation/lib/orderRollup'

export interface OrderOverviewCardsProps {
  order: Order
}

function bookedViaLabel(order: Order): string {
  if (order.agentCode) return `Mobile app · Agent code ${order.agentCode}`
  if (order.channel === 'Counter') return `Counter — ${order.counterStaff ?? 'counter staff'}`
  return 'Mobile app'
}

/** The order-detail summary row: order card + devotee-account card, side by side. */
export function OrderOverviewCards({ order }: OrderOverviewCardsProps) {
  const family = orderFamilyMembers(order)

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-1 basis-80 flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Order</div>
        <OrderDetailField label="Order reference" value={order.ref} />
        <OrderDetailField label="Booked on" value={order.bookedAt} />
        <OrderDetailField label="Payment method" value={order.paymentMethod} />
        <OrderDetailField label="Booked via" value={bookedViaLabel(order)} />
      </div>

      <div className="flex min-w-0 flex-1 basis-80 flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Devotee account</div>
        <OrderDetailField label="Account holder" value={order.devoteeName} />
        <OrderDetailField label="Phone" value={order.phone} />
        <OrderDetailField label="Email" value={<span className="break-all">{order.email}</span>} />
        <div className="mt-0.5 flex flex-col gap-1.75">
          <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Booked for</span>
          <div className="flex flex-wrap gap-1.5">
            {family.map((name) => (
              <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.75 py-1 text-xs font-medium text-ink shadow-xs">
                <Icon name="user" size={12} className="text-ink-subtle" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
