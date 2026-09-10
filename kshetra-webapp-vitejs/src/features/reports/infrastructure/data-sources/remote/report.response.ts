import { z } from 'zod'

import type {
  ReportCatalogue,
  ReportColumn,
  ReportDefinition,
  ReportFilter,
  ReportPeriod,
  ReportResult,
} from '@/features/reports/domain/entities/report'

/**
 * Wire shapes for `report/`.
 *
 * The column and filter enums are `catch`-guarded rather than strict: a report
 * added server-side with a type this build has never heard of must still
 * render — degrading one cell to text is a far better failure than blanking the
 * whole screen, which is the entire point of serving the metadata.
 */

const columnTypeSchema = z
  .enum(['text', 'number', 'money', 'date', 'datetime', 'boolean', 'status', 'list'])
  .catch('text')

const alignSchema = z.enum(['left', 'center', 'right']).catch('left')

const columnSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: columnTypeSchema,
  align: alignSchema,
  sortable: z.boolean(),
  total: z.boolean(),
  help_text: z.string().nullish(),
})

const filterTypeSchema = z.enum(['select', 'search', 'boolean', 'date_range']).catch('search')

const filterOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
})

const filterSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: filterTypeSchema,
  placeholder: z.string().nullish(),
  default: z.string().nullish(),
  help_text: z.string().nullish(),
  options: z.array(filterOptionSchema).nullish(),
  options_source: z.string().nullish(),
  truncated: z.boolean().nullish(),
})

/** Unknown formats are dropped rather than offered as a button that 400s. */
const exportFormatSchema = z.enum(['csv', 'xlsx'])

const definitionSchema = z.object({
  slug: z.string(),
  label: z.string(),
  description: z.string(),
  group: z.string(),
  group_label: z.string(),
  icon: z.string(),
  permitted: z.boolean(),
  has_period: z.boolean(),
  period_field: z.string().nullish(),
  default_period: z.string(),
  default_sort: z.string(),
  columns: z.array(columnSchema),
  filters: z.array(filterSchema).default([]),
  exports: z.array(z.string()).default([]),
})

const groupSchema = z.object({
  key: z.string(),
  label: z.string(),
  reports: z.array(z.string()),
})

export const catalogueResponseSchema = z.object({
  groups: z.array(groupSchema),
  reports: z.array(definitionSchema),
  periods: z.array(z.object({ value: z.string(), label: z.string() })),
  page_size: z.object({ default: z.number(), max: z.number() }),
  export_formats: z.array(z.string()),
})

const periodSchema = z.object({
  period: z.string(),
  date_from: z.string().nullish(),
  date_to: z.string().nullish(),
})

/** `rows` and `totals` are open records — their keys are the report's columns. */
/**
 * The rows endpoint embeds a **trimmed** report block — slug, label,
 * description and columns only, not the full catalogue entry. The screen has
 * the rest from the catalogue already, so nothing is lost by it.
 */
const embeddedReportSchema = z.object({
  slug: z.string(),
  label: z.string(),
  description: z.string(),
  columns: z.array(columnSchema),
})

export const reportResultResponseSchema = z.object({
  report: embeddedReportSchema,
  count: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
  has_next: z.boolean(),
  has_previous: z.boolean(),
  period: periodSchema,
  sort: z.string(),
  filters_applied: z.record(z.string(), z.unknown()).default({}),
  rows: z.array(z.record(z.string(), z.unknown())),
  totals: z.record(z.string(), z.unknown()).default({}),
})

export const optionsResponseSchema = z.object({
  source: z.string(),
  options: z.array(filterOptionSchema),
  truncated: z.boolean().nullish(),
})

export type CatalogueResponseDto = z.infer<typeof catalogueResponseSchema>
export type ReportResultResponseDto = z.infer<typeof reportResultResponseSchema>
export type OptionsResponseDto = z.infer<typeof optionsResponseSchema>

function toColumn(dto: z.infer<typeof columnSchema>): ReportColumn {
  return {
    key: dto.key,
    label: dto.label,
    type: dto.type,
    align: dto.align,
    sortable: dto.sortable,
    total: dto.total,
    helpText: dto.help_text ?? null,
  }
}

function toFilter(dto: z.infer<typeof filterSchema>): ReportFilter {
  return {
    key: dto.key,
    label: dto.label,
    type: dto.type,
    placeholder: dto.placeholder ?? null,
    defaultValue: dto.default ?? null,
    helpText: dto.help_text ?? null,
    options: dto.options ?? [],
    optionsSource: dto.options_source ?? null,
    truncated: dto.truncated ?? false,
  }
}

export function toReportDefinition(dto: z.infer<typeof definitionSchema>): ReportDefinition {
  return {
    slug: dto.slug,
    label: dto.label,
    description: dto.description,
    group: dto.group,
    groupLabel: dto.group_label,
    icon: dto.icon,
    permitted: dto.permitted,
    hasPeriod: dto.has_period,
    periodField: dto.period_field ?? null,
    defaultPeriod: dto.default_period,
    defaultSort: dto.default_sort,
    columns: dto.columns.map(toColumn),
    filters: dto.filters.map(toFilter),
    exports: dto.exports.flatMap((f) => {
      const parsed = exportFormatSchema.safeParse(f)
      return parsed.success ? [parsed.data] : []
    }),
  }
}

export function toCatalogue(dto: CatalogueResponseDto): ReportCatalogue {
  return {
    groups: dto.groups.map((g) => ({ key: g.key, label: g.label, reportSlugs: g.reports })),
    reports: dto.reports.map(toReportDefinition),
    periods: dto.periods,
    defaultPageSize: dto.page_size.default,
    maxPageSize: dto.page_size.max,
    exportFormats: dto.export_formats.flatMap((f) => {
      const parsed = exportFormatSchema.safeParse(f)
      return parsed.success ? [parsed.data] : []
    }),
  }
}

function toPeriod(dto: z.infer<typeof periodSchema>): ReportPeriod {
  return { period: dto.period, dateFrom: dto.date_from ?? null, dateTo: dto.date_to ?? null }
}

export function toReportResult(dto: ReportResultResponseDto): ReportResult {
  return {
    report: {
      slug: dto.report.slug,
      label: dto.report.label,
      description: dto.report.description,
      columns: dto.report.columns.map(toColumn),
    },
    count: dto.count,
    page: dto.page,
    pageSize: dto.page_size,
    totalPages: dto.total_pages,
    hasNext: dto.has_next,
    hasPrevious: dto.has_previous,
    period: toPeriod(dto.period),
    sort: dto.sort,
    filtersApplied: dto.filters_applied,
    rows: dto.rows,
    totals: dto.totals,
  }
}
