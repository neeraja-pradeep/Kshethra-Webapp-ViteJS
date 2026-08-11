import type { Booking, BookingChannel, BookingStatus } from '@/features/bookings/domain/entities/booking'

/** Tone driving a status pill's dot + text colour. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/**
 * Server values are lowercase identifiers; the table shows sentence case.
 * Kept out of the entity so the domain stays free of presentation concerns.
 */

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_TONE: Record<BookingStatus, StatusTone> = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'danger',
}

export function statusLabel(status: BookingStatus): string {
  return STATUS_LABEL[status]
}

export function statusTone(status: BookingStatus): StatusTone {
  return STATUS_TONE[status]
}

const CHANNEL_LABEL: Record<BookingChannel, string> = {
  counter: 'Counter',
  app: 'Mobile app',
}

export function channelLabel(channel: BookingChannel): string {
  return CHANNEL_LABEL[channel]
}

/**
 * Who to credit under "Booked via": the staff member for a counter sale, the
 * devotee's own account for an app booking.
 */
export function bookedByLabel(booking: Booking): string {
  const who = booking.channel === 'counter' ? booking.bookedBy.staffName : booking.bookedBy.name
  return who || '—'
}

/**
 * Payment status is a free-form server value (`paid`, `cancelled`,
 * `awaiting_counter_payment`, …) rather than a closed set, so it is humanised
 * rather than mapped — an unrecognised value still reads correctly.
 */
export function paymentLabel(paymentStatus: string): string {
  if (!paymentStatus) return '—'
  const words = paymentStatus.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const PAYMENT_TONE: Record<string, StatusTone> = {
  paid: 'success',
  cancelled: 'danger',
  refunded: 'info',
  pending: 'warning',
  awaiting_counter_payment: 'warning',
}

export function paymentTone(paymentStatus: string): StatusTone {
  return PAYMENT_TONE[paymentStatus] ?? 'neutral'
}
