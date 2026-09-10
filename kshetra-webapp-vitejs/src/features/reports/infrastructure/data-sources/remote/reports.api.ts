import { http } from '@/core/api/http'
import { REPORT_ENDPOINTS } from '@/core/config/endpoints'

import type { ReportExportFormat, ReportQuery } from '@/features/reports/domain/entities/report'
import {
  catalogueResponseSchema,
  optionsResponseSchema,
  reportResultResponseSchema,
  type CatalogueResponseDto,
  type OptionsResponseDto,
  type ReportResultResponseDto,
} from '@/features/reports/infrastructure/data-sources/remote/report.response'

/**
 * The query string, shared by the rows endpoint and the export.
 *
 * The export reads it exactly as the rows endpoint does — which is why both
 * build it here: the file is the table without its pagination, and the two can
 * never answer different questions.
 *
 * A blank filter value is dropped rather than sent: the server treats an
 * unknown filter *value* as a 400 rather than quietly ignoring it.
 */
function toParams(query: ReportQuery): Record<string, string | number> {
  return {
    ...(query.period ? { period: query.period } : {}),
    ...(query.dateFrom ? { date_from: query.dateFrom } : {}),
    ...(query.dateTo ? { date_to: query.dateTo } : {}),
    ...(query.sort ? { sort: query.sort } : {}),
    ...Object.fromEntries(
      Object.entries(query.filters ?? {}).filter(([, value]) => value !== '' && value != null),
    ),
  }
}

export async function getCatalogue(): Promise<CatalogueResponseDto> {
  const response = await http.get(REPORT_ENDPOINTS.catalogue)
  return catalogueResponseSchema.parse(response.data)
}

export async function getReportRows(slug: string, query: ReportQuery): Promise<ReportResultResponseDto> {
  const response = await http.get(REPORT_ENDPOINTS.rows(slug), {
    params: {
      ...toParams(query),
      ...(query.page ? { page: query.page } : {}),
      ...(query.pageSize ? { page_size: query.pageSize } : {}),
    },
  })
  return reportResultResponseSchema.parse(response.data)
}

/** A filter's dropdown contents. `search` drives a type-ahead over a long list. */
export async function getReportOptions(
  source: string,
  search?: string,
  limit?: number,
): Promise<OptionsResponseDto> {
  const response = await http.get(REPORT_ENDPOINTS.options(source), {
    params: { ...(search ? { search } : {}), ...(limit ? { limit } : {}) },
  })
  return optionsResponseSchema.parse(response.data)
}

/** The server's own filename, e.g. `pooja_report_20260908_1315.csv`. */
const FILENAME_PATTERN = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i

export interface ReportExportFile {
  readonly blob: Blob
  readonly filename: string
}

/**
 * The download. `page`/`page_size` are deliberately not sent — the export is
 * the whole filtered set, and the server ignores them anyway.
 */
export async function getReportExport(
  slug: string,
  format: ReportExportFormat,
  query: ReportQuery,
): Promise<ReportExportFile> {
  const response = await http.get(REPORT_ENDPOINTS.export(slug), {
    params: { ...toParams(query), format },
    responseType: 'blob',
  })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const matched = FILENAME_PATTERN.exec(disposition)?.[1]
  return {
    blob: response.data as Blob,
    filename: matched ? decodeURIComponent(matched) : `${slug}.${format}`,
  }
}
