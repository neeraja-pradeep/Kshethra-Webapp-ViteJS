import { orderPaymentStatusLabel, type OrderPoojaStatus } from '@/shared/order-feed/domain/order-feed'
import type { BadgeColor } from '@/shared/ui'

const POOJA_STATUS_LABELS: Record<OrderPoojaStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function poojaStatusLabel(status: OrderPoojaStatus | null): string {
  return status ? POOJA_STATUS_LABELS[status] : '—'
}

export function poojaStatusColor(status: OrderPoojaStatus): BadgeColor {
  switch (status) {
    case 'completed':
      return 'green'
    case 'cancelled':
      return 'red'
    case 'pending':
      return 'amber'
  }
}

export { orderPaymentStatusLabel }
