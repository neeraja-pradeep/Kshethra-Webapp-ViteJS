import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { AgentBookingFilters } from '@/features/counter-pos/domain/repositories/counter.repository'

/** The only place counter query keys are constructed. */
export const counterKeys = {
  all: QUERY_ROOTS.counter,

  /**
   * The catalogue. Keyed by the search term so each one caches separately and
   * the unsearched list — the till's default view — stays warm behind them.
   */
  poojas: (search = '', godId: number | null = null) =>
    [...counterKeys.all, 'poojas', search, godId] as const,
  gods: () => [...counterKeys.all, 'gods'] as const,
  nakshatrams: () => [...counterKeys.all, 'nakshatrams'] as const,

  summaries: () => [...counterKeys.all, 'collection-summary'] as const,
  summary: (date: string) => [...counterKeys.summaries(), date] as const,

  agentBookings: () => [...counterKeys.all, 'agent-bookings'] as const,
  agentBookingList: (filters: AgentBookingFilters) =>
    [...counterKeys.agentBookings(), filters] as const,

  sales: () => [...counterKeys.all, 'sales'] as const,
  sale: (id: number) => [...counterKeys.sales(), id] as const,
}
