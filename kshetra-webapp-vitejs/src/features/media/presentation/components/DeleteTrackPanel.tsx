import { Button, Icon } from '@/shared/ui'

interface DeleteTrackPanelProps {
  editable: boolean
  onDelete: () => void
}

/** Destructive action panel shown only for an existing track (never while creating one). */
export function DeleteTrackPanel({ editable, onDelete }: DeleteTrackPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
      <div className="min-w-50 flex-1">
        <div className="text-sm font-semibold text-ink-strong">Delete track</div>
        {editable && (
          <div className="mt-0.5 text-2xs text-ink-subtle">Tracks aren&apos;t tied to orders — safe to remove. Or set Inactive to hide it.</div>
        )}
      </div>
      {editable && (
        <Button theme="danger" variant="outline" iconLeft={<Icon name="trash" size={15} />} onClick={onDelete}>
          Delete
        </Button>
      )}
    </div>
  )
}
