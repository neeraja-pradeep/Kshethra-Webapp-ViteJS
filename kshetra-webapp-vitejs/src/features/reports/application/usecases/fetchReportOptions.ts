import type { Result } from '@/core/error/result'
import type { ReportFilterOption } from '@/features/reports/domain/entities/report'
import { reportRepository } from '@/features/reports/infrastructure/repositories/report.repository.impl'

export function fetchReportOptions(
  source: string,
  search?: string,
  limit?: number,
): Promise<Result<readonly ReportFilterOption[]>> {
  return reportRepository.fetchOptions(source, search, limit)
}
