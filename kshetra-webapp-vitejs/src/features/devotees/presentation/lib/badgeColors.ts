import type { BadgeColor } from '@/shared/ui'

import type { BookingStatus, BookingType, DevoteeStatus } from '@/features/devotees/domain/entities/devotee'

/** Account status → Badge color. */
export function devoteeStatusColor(status: DevoteeStatus): BadgeColor {
  return status === 'Active' ? 'green' : 'amber'
}

/** Booking/order status → Badge color. */
export function bookingStatusColor(status: BookingStatus): BadgeColor {
  if (status === 'Completed' || status === 'Delivered') return 'green'
  if (status === 'Cancelled') return 'red'
  if (status === 'Partially Refunded' || status === 'Refunded') return 'blue'
  return 'amber'
}

/** Booking channel → Badge color. */
export function bookingTypeColor(type: BookingType): BadgeColor {
  return type === 'Pooja' ? 'maroon' : 'blue'
}
