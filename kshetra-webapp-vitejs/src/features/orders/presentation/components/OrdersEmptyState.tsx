import { Icon } from '@/shared/ui'

export interface OrdersEmptyStateProps {
  filtered: boolean
  onClearFilters: () => void
}

/** Full-card empty state: no orders yet, or none match the active filters. */
export function OrdersEmptyState({ filtered, onClearFilters }: OrdersEmptyStateProps) {
  return (
    <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-3.25 p-10 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-sunken text-ink-subtle shadow-[inset_0_0_0_1px_var(--border-subtle)]">
        <Icon name={filtered ? 'magnifying-glass' : 'currency-inr'} size={26} />
      </span>
      {filtered ? (
        <span className="inline-flex items-center gap-3 text-sm text-ink-muted">
          No orders match your filters.
          <button
            type="button"
            onClick={onClearFilters}
            className="cursor-pointer rounded-full border-none bg-card px-3.25 py-1.5 text-xs font-medium text-primary shadow-xs"
          >
            Clear filters
          </button>
        </span>
      ) : (
        <p className="m-0 text-sm text-ink-muted">No pooja orders yet.</p>
      )}
    </div>
  )
}
