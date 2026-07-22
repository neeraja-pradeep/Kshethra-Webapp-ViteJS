import { Icon, Spinner } from '@/shared/ui'

export interface ReportExportPanelProps {
  reportName: string
  resultLabel: string
  exportBusy: boolean
  onExportCsv: () => void
  onExportXls: () => void
}

/** Result-set summary: icon, row count, and the CSV / Excel export affordances. */
export function ReportExportPanel({ reportName, resultLabel, exportBusy, onExportCsv, onExportXls }: ReportExportPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-2xl bg-card px-5 py-3.75 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
        <Icon name="file-arrow-down" size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-0.75 text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{reportName}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-ink-strong">{resultLabel}</span>
          <span className="text-sm text-ink-subtle">match the current filters</span>
        </div>
      </div>
      {!exportBusy && (
        <div className="flex shrink-0 gap-2.5">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex h-9.5 items-center gap-2 rounded-md bg-primary px-4.5 font-sans text-sm font-medium text-white transition-colors duration-140 ease-ks hover:bg-primary-hover"
          >
            <Icon name="file-csv" size={17} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={onExportXls}
            className="inline-flex h-9.5 items-center gap-2 rounded-md bg-card px-4.5 font-sans text-sm font-medium text-ink shadow-[inset_0_0_0_1px_var(--border-default)] transition-colors duration-140 ease-ks hover:bg-hover"
          >
            <Icon name="file-xls" size={17} color="var(--color-success)" />
            Export Excel
          </button>
        </div>
      )}
      {exportBusy && (
        <span className="inline-flex h-9.5 shrink-0 items-center gap-2.25 rounded-md bg-sunken px-4 font-sans text-sm text-ink-muted">
          <Spinner size={15} />
          Preparing export…
        </span>
      )}
    </div>
  )
}
