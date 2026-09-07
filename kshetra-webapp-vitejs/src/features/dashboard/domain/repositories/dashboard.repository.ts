import type { Result } from '@/core/error/result'
import type { DashboardSnapshot } from '@/features/dashboard/domain/entities/dashboard-snapshot'

/**
 * The landing screen reads and never writes. There is one method because there
 * is one request: the server counts every card against a single server-side
 * date, so fetching them separately would let two cards disagree about which
 * day it is.
 */
export interface DashboardRepository {
  fetchDashboard(): Promise<Result<DashboardSnapshot>>
}
