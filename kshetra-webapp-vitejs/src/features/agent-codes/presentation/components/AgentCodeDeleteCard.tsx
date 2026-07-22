import { Button, Icon } from '@/shared/ui'

export interface AgentCodeDeleteCardProps {
  disabled: boolean
  note: string
  onDelete: () => void
}

/** Danger-zone footer: permanently remove a code, disabled once it has usage. */
export function AgentCodeDeleteCard({ disabled, note, onDelete }: AgentCodeDeleteCardProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
      <div className="min-w-[200px] flex-1">
        <div className="text-sm font-semibold text-ink-strong">Delete code</div>
        <div className="mt-0.5 text-2xs leading-snug text-ink-subtle">{note}</div>
      </div>
      <Button theme="danger" variant="outline" disabled={disabled} iconLeft={<Icon name="trash" size={15} />} onClick={onDelete}>
        Delete
      </Button>
    </div>
  )
}
