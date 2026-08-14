export interface FilteredEmptyProps {
  message: string
  onClear: () => void
}

/** Table `empty` content when filters hide every row — message + one-click reset. */
export function FilteredEmpty({ message, onClear }: FilteredEmptyProps) {
  return (
    <span className="inline-flex items-center gap-3">
      {message}
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer rounded-full border-none bg-card px-3.25 py-1.5 font-sans text-xs font-medium text-primary shadow-xs"
      >
        Clear filters
      </button>
    </span>
  )
}
