import type { Result } from '@/core/error/result'
import type { ReportQuery, ReportResult } from '@/features/reports/domain/entities/report'
import { reportRepository } from '@/features/reports/infrastructure/repositories/report.repository.impl'

export function fetchReport(slug: string, query: ReportQuery): Promise<Result<ReportResult>> {
  return reportRepository.fetchReport(slug, query)
}
