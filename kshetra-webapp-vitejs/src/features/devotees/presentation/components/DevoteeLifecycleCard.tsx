import { Button, Icon } from '@/shared/ui'

import type { Devotee } from '@/features/devotees/domain/entities/devotee'

export interface DevoteeLifecycleCardProps {
  devotee: Devotee
  onSuspend: () => void
  onReactivate: () => void
  onDelete: () => void
}

/** Suspend/reactivate/delete controls, with a note on why delete may be disabled. */
export function DevoteeLifecycleCard({ devotee, onSuspend, onReactivate, onDelete }: DevoteeLifecycleCardProps) {
  const bookingCount = devotee.bookings.length
  const deleteDisabled = bookingCount > 0
  const lifecycleNote = deleteDisabled
    ? `Can’t delete — ${bookingCount} order${bookingCount === 1 ? '' : 's'} on this account. Suspend instead to preserve history.`
    : 'No orders on this account, so it can be permanently deleted. Suspend to keep history.'

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
      <div className="min-w-[200px] flex-1">
        <div className="text-sm font-semibold text-ink-strong">Account lifecycle</div>
        <div className="mt-0.5 text-2xs leading-snug text-ink-subtle">{lifecycleNote}</div>
      </div>
      {devotee.status === 'Active' && (
        <Button theme="default" variant="outline" onClick={onSuspend}>
          <Icon name="pause-circle" size={15} />
          Suspend account
        </Button>
      )}
      {devotee.status === 'Suspended' && (
        <Button theme="default" variant="outline" onClick={onReactivate}>
          <Icon name="play-circle" size={15} />
          Reactivate
        </Button>
      )}
      <Button theme="danger" variant="outline" disabled={deleteDisabled} onClick={onDelete}>
        <Icon name="trash" size={15} />
        Delete
      </Button>
    </div>
  )
}
