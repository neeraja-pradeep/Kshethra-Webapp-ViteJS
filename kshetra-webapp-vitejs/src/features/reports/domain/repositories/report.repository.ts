import type { Result } from '@/core/error/result'
import type {
  ReportCatalogue,
  ReportExportFormat,
  ReportFilterOption,
  ReportQuery,
  ReportResult,
} from '@/features/reports/domain/entities/report'

/** The saved file, named as the server named it. */
export interface ReportExportFile {
  readonly blob: Blob
  readonly filename: string
}

export interface ReportRepository {
  /** The card grid and every report's metadata. One call drives the whole screen. */
  fetchCatalogue(): Promise<Result<ReportCatalogue>>
  fetchReport(slug: string, query: ReportQuery): Promise<Result<ReportResult>>
  /** A filter's dropdown contents, for filters naming an `optionsSource`. */
  fetchOptions(source: string, search?: string, limit?: number): Promise<Result<readonly ReportFilterOption[]>>
  /**
   * The download, over the same query the table is showing. Refused with a
   * `400` past 100,000 rows rather than silently truncated.
   */
  exportReport(slug: string, format: ReportExportFormat, query: ReportQuery): Promise<Result<ReportExportFile>>
}
