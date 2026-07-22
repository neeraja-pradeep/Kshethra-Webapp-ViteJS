import type { BookingsTrendPoint } from '@/features/dashboard/domain/entities/chart-series-point'

/**
 * Confirmed pooja bookings per day for the next 7 days (today first).
 * Mirrors the DC prototype's `next7` derivation over the bookings seed
 * (count of non-cancelled bookings whose date matches each day).
 */
export const BOOKINGS_TREND: BookingsTrendPoint[] = [
  { date: '2026-07-22', count: 8, isToday: true },
  { date: '2026-07-23', count: 11, isToday: false },
  { date: '2026-07-24', count: 6, isToday: false },
  { date: '2026-07-25', count: 14, isToday: false },
  { date: '2026-07-26', count: 19, isToday: false },
  { date: '2026-07-27', count: 21, isToday: false },
  { date: '2026-07-28', count: 9, isToday: false },
]
