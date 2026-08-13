import type { BadgeColor } from '@/shared/ui'

import type { OrderPaymentStatus } from '@/shared/order-feed/domain/order-feed'

/**
 * Badge colour per payment status.
 *
 * `awaiting_counter_payment` is deliberately **blue, not amber**: the devotee
 * agreed to pay at the desk, so nothing is late. Colouring it like `pending`
 * tells the back office to chase a payment that was never overdue.
 */
export function paymentStatusColor(status: OrderPaymentStatus): BadgeColor {
  switch (status) {
    case 'paid':
      return 'green'
    case 'pending':
      return 'amber'
    case 'awaiting_counter_payment':
      return 'blue'
    case 'failed':
    case 'cancelled':
      return 'red'
    case 'refund_pending':
      return 'amber'
    case 'partially_refunded':
      return 'amber'
    case 'refunded':
      return 'gray'
  }
}

/** Dot colour (CSS var) for the summary band's status cluster. */
export function paymentStatusDot(status: OrderPaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'var(--color-success)'
    case 'pending':
    case 'refund_pending':
    case 'partially_refunded':
      return 'var(--color-warning)'
    case 'awaiting_counter_payment':
      return 'var(--color-info)'
    case 'failed':
    case 'cancelled':
      return 'var(--color-danger)'
    case 'refunded':
      return 'var(--text-subtle)'
  }
}
