import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { DashboardSnapshot } from '@/features/dashboard/domain/entities/dashboard-snapshot'
import type { DashboardRepository } from '@/features/dashboard/domain/repositories/dashboard.repository'
import { getDashboardData } from '@/features/dashboard/infrastructure/data-sources/remote/dashboard.api'
import { toDashboardSnapshot } from '@/features/dashboard/infrastructure/data-sources/remote/dashboard.response'

export const dashboardRepository: DashboardRepository = {
  async fetchDashboard(): Promise<Result<DashboardSnapshot>> {
    try {
      return ok(toDashboardSnapshot(await getDashboardData()))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
