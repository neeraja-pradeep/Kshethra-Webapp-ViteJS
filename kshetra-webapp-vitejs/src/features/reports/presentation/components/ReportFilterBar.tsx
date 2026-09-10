import { Button, Input, Select } from '@/shared/ui'
import type { SelectOption } from '@/shared/ui'

import type {
  ReportFilter,
  ReportFilterOption,
  ReportPeriodPreset,
} from '@/features/reports/domain/entities/report'

export interface ReportFilterBarProps {
  /** The report's own filters, as the catalogue defines them. */
  filters: readonly ReportFilter[]
  /** The period presets, served rather than hardcoded. */
  periods: readonly ReportPeriodPreset[]
  hasPeriod: boolean
  /** Which date the period narrows, e.g. `pooja_date`. Shown so the window is unambiguous. */
  periodField: string | null
  period: string
  dateFrom: string
  dateTo: string
  /** The report's own filter values, keyed as the catalogue names them. */
  values: Readonly<Record<string, string>>
  /** Options fetched for filters that name an `optionsSource`, keyed by source. */
  fetchedOptions: Readonly<Record<string, readonly ReportFilterOption[]>>
  onPeriodChange: (period: string) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onFilterChange: (key: string, value: string) => void
  onReset: () => void
}

/** `period=custom` is the one preset that reveals the two date inputs. */
const CUSTOM_PERIOD = 'custom'

/**
 * The filter row, built from the report's own definitions.
 *
 * Nothing here knows which report is showing: the controls, their labels, their
 * dropdown contents and the period presets all come from the catalogue, so a
 * filter added server-side appears with no frontend release.
 *
 * The `date_range` filter is skipped — the period control above already *is*
 * that filter, and drawing it twice would offer two ways to set one window.
 */
export function ReportFilterBar({
  filters,
  periods,
  hasPeriod,
  periodField,
  period,
  dateFrom,
  dateTo,
  values,
  fetchedOptions,
  onPeriodChange,
  onDateFromChange,
  onDateToChange,
  onFilterChange,
  onReset,
}: ReportFilterBarProps) {
  const periodOptions: SelectOption[] = periods.map((p) => ({ value: p.value, label: p.label }))
  const ownFilters = filters.filter((f) => f.type !== 'date_range')

  return (
    <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
      {hasPeriod && (
        <>
          <div className="w-[170px]">
            <Select
              size="sm"
              aria-label="Period"
              options={periodOptions}
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
            />
          </div>
          {period === CUSTOM_PERIOD && (
            <>
              <Input
                size="sm"
                type="date"
                aria-label="From"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
              />
              <Input
                size="sm"
                type="date"
                aria-label="To"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
              />
            </>
          )}
          {periodField && (
            <span className="text-2xs text-ink-subtle">
              by <span className="font-medium text-ink-muted">{periodField.replace(/_/g, ' ')}</span>
            </span>
          )}
        </>
      )}

      {ownFilters.map((filter) => {
        const value = values[filter.key] ?? ''

        if (filter.type === 'search') {
          return (
            <div key={filter.key} className="w-[200px]">
              <Input
                size="sm"
                aria-label={filter.label}
                placeholder={filter.placeholder ?? filter.label}
                value={value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
              />
            </div>
          )
        }

        /* A boolean filter is a three-way: unset, yes, no — unset must stay
           reachable, so it is a select rather than a checkbox. */
        const options: SelectOption[] =
          filter.type === 'boolean'
            ? [
                { value: '', label: filter.placeholder ?? `All ${filter.label.toLowerCase()}` },
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ]
            : (filter.optionsSource ? (fetchedOptions[filter.optionsSource] ?? filter.options) : filter.options).map(
                (o) => ({ value: o.value, label: o.label }),
              )

        return (
          <div key={filter.key} className="w-[170px]">
            <Select
              size="sm"
              aria-label={filter.label}
              title={filter.helpText ?? undefined}
              options={options}
              value={value}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
            />
          </div>
        )
      })}

      <Button size="sm" variant="ghost" onClick={onReset}>
        Reset
      </Button>
    </div>
  )
}
