import axios from 'axios'

import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type {
  ReportCatalogue,
  ReportExportFormat,
  ReportFilterOption,
  ReportQuery,
  ReportResult,
} from '@/features/reports/domain/entities/report'
import type {
  ReportExportFile,
  ReportRepository,
} from '@/features/reports/domain/repositories/report.repository'
import {
  toCatalogue,
  toReportResult,
} from '@/features/reports/infrastructure/data-sources/remote/report.response'
import {
  getCatalogue,
  getReportExport,
  getReportOptions,
  getReportRows,
} from '@/features/reports/infrastructure/data-sources/remote/reports.api'

/**
 * An export asks for a blob, so its **error** body arrives as a blob too — and
 * `mapHttpError` reads a JSON object. Without this the server's own words ("…
 * over the 100,000 limit …", "Excel export needs the openpyxl package") would
 * be replaced by a generic failure message. Re-reads the blob as text, parses
 * it, and hands the mapper the shape it expects.
 */
async function mapExportError(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text()
      error.response.data = JSON.parse(text) as unknown
    } catch {
      // A truly non-JSON body (an HTML error page) leaves the generic message.
    }
  }
  return mapHttpError(error)
}

export const reportRepository: ReportRepository = {
  async fetchCatalogue(): Promise<Result<ReportCatalogue>> {
    try {
      return ok(toCatalogue(await getCatalogue()))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchReport(slug: string, query: ReportQuery): Promise<Result<ReportResult>> {
    try {
      return ok(toReportResult(await getReportRows(slug, query)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchOptions(
    source: string,
    search?: string,
    limit?: number,
  ): Promise<Result<readonly ReportFilterOption[]>> {
    try {
      return ok((await getReportOptions(source, search, limit)).options)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async exportReport(
    slug: string,
    format: ReportExportFormat,
    query: ReportQuery,
  ): Promise<Result<ReportExportFile>> {
    try {
      return ok(await getReportExport(slug, format, query))
    } catch (error) {
      return err(await mapExportError(error))
    }
  },
}
