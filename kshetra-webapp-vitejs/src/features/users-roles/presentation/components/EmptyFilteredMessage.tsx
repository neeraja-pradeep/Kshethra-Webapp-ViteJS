export interface EmptyFilteredMessageProps {
  message: string
  onClearFilters: () => void
}

/** Filtered-empty state: a message plus a one-click "Clear filters" pill. */
export function EmptyFilteredMessage({ message, onClearFilters }: EmptyFilteredMessageProps) {
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
