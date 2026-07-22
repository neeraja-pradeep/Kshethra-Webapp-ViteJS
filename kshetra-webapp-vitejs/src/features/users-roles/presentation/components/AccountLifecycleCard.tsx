import { Button, Icon } from '@/shared/ui'

export interface AccountLifecycleCardProps {
  note: string
  isActive: boolean
  deleteDisabled: boolean
  onDeactivate: () => void
  onReactivate: () => void
  onDelete: () => void
}

/** Bottom-of-detail card: deactivate/reactivate + delete, with a rationale note. */
export function AccountLifecycleCard({ note, isActive, deleteDisabled, onDeactivate, onReactivate, onDelete }: AccountLifecycleCardProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
      <div className="min-w-[220px] flex-1">
        <div className="text-sm font-semibold text-ink-strong">Account lifecycle</div>
        <div className="mt-0.5 text-xs leading-snug text-ink-subtle">{note}</div>
      </div>
      {isActive ? (
        <Button theme="default" variant="outline" onClick={onDeactivate} iconLeft={<Icon name="pause-circle" size={15} />}>
          Deactivate
        </Button>
      ) : (
        <Button theme="default" variant="outline" onClick={onReactivate} iconLeft={<Icon name="play-circle" size={15} />}>
          Reactivate
        </Button>
      )}
      <Button theme="danger" variant="outline" disabled={deleteDisabled} onClick={onDelete} iconLeft={<Icon name="trash" size={15} />}>
        Delete
      </Button>
    </div>
  )
}
