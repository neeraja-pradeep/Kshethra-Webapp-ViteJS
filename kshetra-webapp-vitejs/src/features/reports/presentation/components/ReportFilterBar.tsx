import { Button, Select } from '@/shared/ui'

import { DATE_RANGE_PRESETS } from '@/features/reports/presentation/data/reports-catalogue.mock'

import type { DateRangePreset, ReportFilterDef, ReportFilterState } from '@/features/reports/domain/entities/report'

export interface ReportFilterBarProps {
  hasDate: boolean
  filters: ReportFilterState
  extraFilters: readonly ReportFilterDef[]
  onPresetChange: (preset: DateRangePreset) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onExtraChange: (key: string, value: string) => void
  onReset: () => void
}

const PRESET_OPTIONS = DATE_RANGE_PRESETS.map((preset) => ({ value: preset, label: preset }))

/** Shared filter row — date range (when relevant) plus the report's own extra filters. */
export function ReportFilterBar({
  hasDate,
  filters,
  extraFilters,
  onPresetChange,
  onFromChange,
  onToChange,
  onExtraChange,
  onReset,
}: ReportFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
      {hasDate && (
        <>
          <div className="w-[180px]">
            <Select
              size="sm"
              aria-label="Date range"
              options={PRESET_OPTIONS}
              value={filters.preset}
              onChange={(e) => onPresetChange(e.target.value as DateRangePreset)}
            />
          </div>
          {filters.preset === 'Custom range' && (
            <>
              <input
                type="date"
                aria-label="From"
                value={filters.from}
                onChange={(e) => onFromChange(e.target.value)}
                className="h-8 rounded-md bg-card px-2.5 font-sans text-sm text-ink shadow-xs"
              />
              <span className="text-ink-subtle">→</span>
              <input
                type="date"
                aria-label="Until"
                value={filters.to}
                onChange={(e) => onToChange(e.target.value)}
                className="h-8 rounded-md bg-card px-2.5 font-sans text-sm text-ink shadow-xs"
              />
            </>
          )}
        </>
      )}
      {extraFilters.map((filter) => (
        <div key={filter.key} className="w-[180px]">
          <Select
            size="sm"
            aria-label={filter.label}
            options={[{ value: 'all', label: filter.label }, ...filter.options.map((option) => ({ value: option, label: option }))]}
            value={filters.extra[filter.key] ?? 'all'}
            onChange={(e) => onExtraChange(filter.key, e.target.value)}
          />
        </div>
      ))}
      <Button theme="default" variant="outline" size="sm" onClick={onReset}>
        Reset
      </Button>
    </div>
  )
}
