import { Icon } from '@/shared/ui'

export interface BookingsEmptyStateProps {
  icon: string
  message: string
  filtersActive: boolean
  onClearFilters: () => void
}

/** Empty + filtered-empty state shown in place of the table. */
export function BookingsEmptyState({ icon, message, filtersActive, onClearFilters }: BookingsEmptyStateProps) {
  return (
    <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-3.25 p-10 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-sunken text-ink-subtle shadow-[inset_0_0_0_1px_var(--border-subtle)]">
        <Icon name={icon} size={26} />
      </span>
      <p className="m-0 text-sm text-ink-muted">{message}</p>
      {filtersActive && (
        <button
          type="button"
          onClick={onClearFilters}
          className="cursor-pointer rounded-full border-none bg-card px-3.25 py-1.5 text-xs font-medium text-primary shadow-xs"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
