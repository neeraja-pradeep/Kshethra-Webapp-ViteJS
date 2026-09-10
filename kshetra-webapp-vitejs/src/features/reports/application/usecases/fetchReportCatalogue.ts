import type { Result } from '@/core/error/result'
import type { ReportCatalogue } from '@/features/reports/domain/entities/report'
import { reportRepository } from '@/features/reports/infrastructure/repositories/report.repository.impl'

export function fetchReportCatalogue(): Promise<Result<ReportCatalogue>> {
  return reportRepository.fetchCatalogue()
}
