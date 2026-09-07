import { http } from '@/core/api/http'
import { DASHBOARD_ENDPOINTS } from '@/core/config/endpoints'

import {
  dashboardResponseSchema,
  type DashboardResponseDto,
} from '@/features/dashboard/infrastructure/data-sources/remote/dashboard.response'

/** Every card on the landing screen, in one request. Takes no parameters. */
export async function getDashboardData(): Promise<DashboardResponseDto> {
  const response = await http.get(DASHBOARD_ENDPOINTS.data)
  return dashboardResponseSchema.parse(response.data)
}
