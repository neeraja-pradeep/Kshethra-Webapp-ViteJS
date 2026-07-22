import { Button, Icon, Modal } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

export interface ReassignPoojariModalProps {
  open: boolean
  poojaLabel: string
  priests: readonly string[]
  currentPriest: string
  selected: string | null
  onSelect: (name: string) => void
  onClose: () => void
  onConfirm: () => void
}

/** Pick a priest (same or different) to reassign a scheduled pooja to. */
export function ReassignPoojariModal({ open, poojaLabel, priests, currentPriest, selected, onSelect, onClose, onConfirm }: ReassignPoojariModalProps) {
  return (
    <Modal
      open={open}
      title="Reassign poojari"
      description={poojaLabel}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button theme="default" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button theme="primary" disabled={!selected} onClick={onConfirm} iconLeft={<Icon name="arrows-clockwise" size={15} />}>
            Confirm reassign
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-1.75 py-1">
        <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">Assign to (same or different)</span>
        {priests.map((name) => {
          const isCurrent = name === currentPriest
          const isSelected = name === selected
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              className={cn(
                'flex w-full items-center gap-2.75 rounded-lg bg-card px-3 py-2.75 text-left font-sans hover:bg-hover',
                isSelected ? 'shadow-[inset_0_0_0_1.5px_var(--color-primary)]' : 'shadow-[inset_0_0_0_1px_var(--border-default)]',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-white',
                  isSelected ? 'bg-primary shadow-none' : 'bg-transparent shadow-[inset_0_0_0_1px_var(--border-strong)]',
                )}
              >
                {isSelected && <Icon name="check" size={11} />}
              </span>
              <span className="flex-1 text-sm font-medium text-ink">{name}</span>
              {isCurrent && <span className="rounded-full bg-sunken px-2 py-0.5 text-2xs font-medium text-ink-subtle">Current</span>}
            </button>
          )
        })}
      </div>
      <div className="flex items-start gap-2 pb-1 text-xs leading-snug text-ink-muted">
        <Icon name="clock-countdown" size={16} className="mt-px shrink-0 text-info" />
        The reassigned pooja must be completed within 24 hours. If not, it will need to be reassigned again.
      </div>
    </Modal>
  )
}
