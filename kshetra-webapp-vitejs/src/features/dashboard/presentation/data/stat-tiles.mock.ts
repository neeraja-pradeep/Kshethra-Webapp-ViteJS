import { formatINR } from '@/shared/lib/format'

import type { StatTile } from '@/features/dashboard/domain/entities/stat-tile'

/**
 * Header stats for the "Pooja bookings" section. Poojas-today and
 * next-7-days are denormalized sums of `BOOKINGS_TREND` (see
 * `bookings-trend.mock.ts`); collected-this-month mirrors the DC
 * prototype's `monthPaid` (paid, non-cancelled bookings for the month).
 */
export const POOJA_BOOKING_STATS: StatTile[] = [
  { value: '8', label: 'Poojas today' },
  { value: '88', label: 'Next 7 days' },
  { value: formatINR(184600), label: 'Collected this month' },
]

/** Header stats for the "Store orders" section — copied verbatim from the seed. */
export const STORE_ORDER_STATS: StatTile[] = [
  { value: '4', label: 'Open orders' },
  { value: '6', label: 'Delivered' },
  { value: '1', label: 'Cancelled' },
]

/**
 * Header stats for the "Counter bookings" section. Collection-today mirrors
 * `COUNTER_TREND`'s last entry; receipts/poojas-booked are copied verbatim.
 */
export const COUNTER_BOOKING_STATS: StatTile[] = [
  { value: formatINR(12150), label: 'Collection today' },
  { value: '14', label: 'Receipts today' },
  { value: '19', label: 'Poojas booked' },
]
