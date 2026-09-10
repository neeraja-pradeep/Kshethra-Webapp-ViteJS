import type { Result } from '@/core/error/result'
import type { ReportExportFormat, ReportQuery } from '@/features/reports/domain/entities/report'
import type { ReportExportFile } from '@/features/reports/domain/repositories/report.repository'
import { reportRepository } from '@/features/reports/infrastructure/repositories/report.repository.impl'

export function exportReport(
  slug: string,
  format: ReportExportFormat,
  query: ReportQuery,
): Promise<Result<ReportExportFile>> {
  return reportRepository.exportReport(slug, format, query)
}
