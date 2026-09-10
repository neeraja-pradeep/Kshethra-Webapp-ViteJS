/**
 * Domain types for Reports. Plain data — no logic, no React.
 *
 * There is **one** row type, not one per report. Every report answers on the
 * same three endpoints with the same envelope, and what a row contains is
 * described by `columns[]` rather than by a TypeScript interface — which is
 * what lets a report added server-side render with no frontend release.
 */

/** Drives how a cell is rendered and aligned. */
export type ReportColumnType =
  | 'text'
  | 'number'
  | 'money'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'status'
  | 'list'

export type ReportColumnAlign = 'left' | 'center' | 'right'

export interface ReportColumn {
  readonly key: string
  readonly label: string
  readonly type: ReportColumnType
  readonly align: ReportColumnAlign
  /** `list` columns are the one kind that cannot sort — there is no single value. */
  readonly sortable: boolean
  /** Whether `totals` carries a figure for this column. */
  readonly total: boolean
  readonly helpText: string | null
}

/** How a filter is drawn. `date_range` is the shared period control. */
export type ReportFilterType = 'select' | 'search' | 'boolean' | 'date_range'

export interface ReportFilterOption {
  readonly value: string
  readonly label: string
}

export interface ReportFilter {
  readonly key: string
  readonly label: string
  readonly type: ReportFilterType
  readonly placeholder: string | null
  readonly defaultValue: string | null
  readonly helpText: string | null
  /** Embedded for short fixed lists; empty when `optionsSource` names a lookup. */
  readonly options: readonly ReportFilterOption[]
  /** Fetch from `report/options/<source>/` — use `search` for a type-ahead. */
  readonly optionsSource: string | null
  /** The embedded list was cut short; the full set needs the lookup. */
  readonly truncated: boolean
}

export type ReportExportFormat = 'csv' | 'xlsx'

/** One report's metadata — everything its card and its screen need. */
export interface ReportDefinition {
  readonly slug: string
  readonly label: string
  readonly description: string
  readonly group: string
  readonly groupLabel: string
  /** A Lucide icon name, served rather than hardcoded. */
  readonly icon: string
  /**
   * Whether the caller may run it. The catalogue never lists a report that
   * would 403, so this is for greying a card rather than gating the request.
   */
  readonly permitted: boolean
  readonly hasPeriod: boolean
  /** Which date the period narrows — show it, so an admin knows what the window is *of*. */
  readonly periodField: string | null
  readonly defaultPeriod: string
  readonly defaultSort: string
  readonly columns: readonly ReportColumn[]
  readonly filters: readonly ReportFilter[]
  readonly exports: readonly ReportExportFormat[]
}

/** One catalogue section — slugs in render order, looked up in `reports`. */
export interface ReportGroup {
  readonly key: string
  readonly label: string
  readonly reportSlugs: readonly string[]
}

export interface ReportPeriodPreset {
  readonly value: string
  readonly label: string
}

export interface ReportCatalogue {
  readonly groups: readonly ReportGroup[]
  readonly reports: readonly ReportDefinition[]
  readonly periods: readonly ReportPeriodPreset[]
  readonly defaultPageSize: number
  readonly maxPageSize: number
  readonly exportFormats: readonly ReportExportFormat[]
}

/**
 * One row, keyed by column key.
 *
 * Values arrive as whatever the column's type implies — a `money` column is a
 * **string** so no decimal is lost to a float in transit, a `list` column an
 * array. Read them through the column definition, never by assuming a shape.
 */
export type ReportRow = Readonly<Record<string, unknown>>

/** The window that was actually resolved, echoed back by the server. */
export interface ReportPeriod {
  readonly period: string
  readonly dateFrom: string | null
  readonly dateTo: string | null
}

/**
 * What the rows endpoint echoes back about the report itself — a trimmed
 * block, not the full catalogue entry. `columns` is what the table renders
 * from; everything else about the report comes from the catalogue.
 */
export interface ReportResultReport {
  readonly slug: string
  readonly label: string
  readonly description: string
  readonly columns: readonly ReportColumn[]
}

/**
 * A page of a report, plus everything about how it was answered.
 *
 * `totals` is over the **whole filtered set, never the page**, and carries
 * `rows` on every report alongside a figure per `total: true` column.
 */
export interface ReportResult {
  readonly report: ReportResultReport
  /** Rows matching the filters — the whole set, not this page. */
  readonly count: number
  readonly page: number
  readonly pageSize: number
  readonly totalPages: number
  readonly hasNext: boolean
  readonly hasPrevious: boolean
  readonly period: ReportPeriod
  /** The sort actually applied, `-` prefixed for descending. */
  readonly sort: string
  /** Only the filters that were honoured. */
  readonly filtersApplied: Readonly<Record<string, unknown>>
  readonly rows: readonly ReportRow[]
  readonly totals: Readonly<Record<string, unknown>>
}

/** What the screen sends when asking for a page. */
export interface ReportQuery {
  readonly period?: string
  readonly dateFrom?: string
  readonly dateTo?: string
  readonly sort?: string
  readonly page?: number
  readonly pageSize?: number
  /** The report's own filters, keyed as the catalogue names them. */
  readonly filters?: Readonly<Record<string, string>>
}
