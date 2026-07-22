import type { BadgeColor } from '@/shared/ui'
import type { OrderPaymentStatus, OrderRecordStatus } from '@/features/orders/domain/entities/order'

/** Payment-status badge color, mirroring the prototype's payTone map (default: gray). */
export function paymentStatusColor(status: OrderPaymentStatus): BadgeColor {
  switch (status) {
    case 'Paid':
      return 'green'
    case 'Partially Refunded':
      return 'amber'
    case 'Refunded':
      return 'gray'
    default:
      return 'gray'
  }
}

/** Booking-status (rollup) badge color, mirroring the prototype's bkTone map. */
export function bookingStatusColor(status: OrderRecordStatus): BadgeColor {
  switch (status) {
    case 'Completed':
      return 'green'
    case 'Cancelled':
      return 'red'
    default:
      return 'amber'
  }
}

/** Solid dot color (CSS var) for the KPI-band payment-status summary chips. */
export function paymentStatusDot(status: OrderPaymentStatus): string {
  switch (status) {
    case 'Paid':
      return 'var(--color-success)'
    case 'Pending':
      return 'var(--color-warning)'
    case 'Partially Refunded':
      return 'var(--color-info)'
    case 'Refunded':
      return 'var(--text-subtle)'
  }
}
