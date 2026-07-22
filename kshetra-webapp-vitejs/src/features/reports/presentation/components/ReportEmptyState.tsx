import { Button, Icon } from '@/shared/ui'

export interface ReportEmptyStateProps {
  icon: string
  message: string
  showClearFilters: boolean
  onClearFilters: () => void
}

/** No rows for the current filters (or a flagged report with no data source yet). */
export function ReportEmptyState({ icon, message, showClearFilters, onClearFilters }: ReportEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3.25 py-9 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sunken text-ink-subtle shadow-[inset_0_0_0_1px_var(--border-subtle)]">
        <Icon name={icon} size={26} />
      </span>
      <p className="max-w-[440px] text-sm leading-normal text-ink-muted">{message}</p>
      {showClearFilters && (
        <Button theme="default" variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
