export interface DevoteesEmptyStateProps {
  filtered: boolean
  onClearFilters: () => void
}

/** Table empty-state message: plain when the list truly has no rows, with a "Clear filters" action when a filter hid everything. */
export function DevoteesEmptyState({ filtered, onClearFilters }: DevoteesEmptyStateProps) {
  if (!filtered) return <>No devotees yet.</>

  return (
    <span className="inline-flex items-center gap-3">
      No devotees match your filters.
      <button
        type="button"
        onClick={onClearFilters}
        className="cursor-pointer rounded-full border-none bg-card px-3.25 py-1.5 text-xs font-medium text-primary shadow-xs"
      >
        Clear filters
      </button>
    </span>
  )
}
