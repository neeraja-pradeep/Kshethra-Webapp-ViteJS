interface FilteredEmptyStateProps {
  message: string
  onClearFilters: () => void
}

/** "No tracks match your filters." + a one-click reset, used as the Table's empty state. */
export function FilteredEmptyState({ message, onClearFilters }: FilteredEmptyStateProps) {
  return (
    <span className="inline-flex items-center gap-3">
      {message}
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
