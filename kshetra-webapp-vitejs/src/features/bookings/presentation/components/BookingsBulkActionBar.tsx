import { Button, Icon } from '@/shared/ui'

export interface BookingsBulkActionBarProps {
  selectedCount: number
  /** `rbac.manage_pooja_orders`. */
  canComplete: boolean
  /** `rbac.assign_poojari` — a separate grant from completing work. */
  canAssign: boolean
  busy: boolean
  onReassign: () => void
  onMarkComplete: () => void
  onClear: () => void
}

/**
 * Shown once one or more rows are selected — bulk reassign / complete / clear.
 *
 * The count says "on this page" because selection cannot reach rows the
 * operator has not seen: the list is paged server-side.
 */
export function BookingsBulkActionBar({
  selectedCount,
  canComplete,
  canAssign,
  busy,
  onReassign,
  onMarkComplete,
  onClear,
}: BookingsBulkActionBarProps) {
  return (
    <div className="mx-7 mb-3 flex flex-shrink-0 flex-wrap items-center gap-2.5 rounded-lg bg-primary-subtle py-2.25 pl-4 pr-2.5">
      <span className="text-sm font-semibold text-primary">
        {selectedCount.toLocaleString('en-IN')} selected on this page
      </span>
      <div className="flex-1" />
      {canAssign && (
        <Button
          theme="default"
          variant="outline"
          size="sm"
          disabled={busy}
          iconLeft={<Icon name="arrows-clockwise" size={14} />}
          onClick={onReassign}
        >
          Reassign poojari
        </Button>
      )}
      {canComplete && (
        <Button
          theme="default"
          variant="outline"
          size="sm"
          disabled={busy}
          iconLeft={<Icon name="seal-check" size={14} />}
          onClick={onMarkComplete}
        >
          Mark complete
        </Button>
      )}
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer rounded-md border-none bg-transparent px-2.5 py-1.75 text-xs font-medium text-ink-muted hover:bg-hover hover:text-ink-strong"
      >
        Clear
      </button>
    </div>
  )
}
