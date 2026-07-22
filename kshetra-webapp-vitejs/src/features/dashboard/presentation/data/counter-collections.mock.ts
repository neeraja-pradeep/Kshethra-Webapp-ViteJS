import type { CounterCollectionPoint } from '@/features/dashboard/domain/entities/chart-series-point'

/**
 * Counter (walk-in) cash collections for the last 7 days, today last.
 * Amounts copied verbatim from the DC prototype's `COUNTER_TREND` seed.
 */
export const COUNTER_COLLECTIONS: CounterCollectionPoint[] = [
  { date: '2026-07-16', amount: 16850, isToday: false },
  { date: '2026-07-17', amount: 19200, isToday: false },
  { date: '2026-07-18', amount: 27400, isToday: false },
  { date: '2026-07-19', amount: 29850, isToday: false },
  { date: '2026-07-20', amount: 15400, isToday: false },
  { date: '2026-07-21', amount: 18200, isToday: false },
  { date: '2026-07-22', amount: 12150, isToday: true },
]
