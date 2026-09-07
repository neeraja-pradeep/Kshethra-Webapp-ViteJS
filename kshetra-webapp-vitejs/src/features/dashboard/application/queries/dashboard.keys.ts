import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

/** The only place dashboard query keys are constructed. */
export const dashboardKeys = {
  all: QUERY_ROOTS.dashboard,
  snapshot: () => [...QUERY_ROOTS.dashboard, 'snapshot'] as const,
}
