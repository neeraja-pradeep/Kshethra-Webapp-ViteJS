import type { Result } from '@/core/error/result'
import type { DashboardSnapshot } from '@/features/dashboard/domain/entities/dashboard-snapshot'
import { dashboardRepository } from '@/features/dashboard/infrastructure/repositories/dashboard.repository.impl'

export function fetchDashboard(): Promise<Result<DashboardSnapshot>> {
  return dashboardRepository.fetchDashboard()
}
