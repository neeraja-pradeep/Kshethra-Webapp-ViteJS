import { QUERY_ROOTS } from '@/shared/lib/queryKeys'

import type { ReportQuery } from '@/features/reports/domain/entities/report'

/** The only place report query keys are constructed. */
export const reportKeys = {
  all: QUERY_ROOTS.reports,
  catalogue: () => [...reportKeys.all, 'catalogue'] as const,
  rows: (slug: string, query: ReportQuery) => [...reportKeys.all, 'rows', slug, query] as const,
  options: (source: string, search: string) => [...reportKeys.all, 'options', source, search] as const,
}
