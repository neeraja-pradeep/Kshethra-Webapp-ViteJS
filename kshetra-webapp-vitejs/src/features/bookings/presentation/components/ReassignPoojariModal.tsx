import { Button, Icon, Modal } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

export interface ReassignPoojariModalProps {
  open: boolean
  contextLabel: string
  priests: readonly string[]
  currentPriest: string | null
  selected: string | null
  onSelect: (name: string) => void
  onClose: () => void
  onConfirm: () => void
}

/** Reassign-poojari dialog — pick any priest (including the current one). */
export function ReassignPoojariModal({ open, contextLabel, priests, currentPriest, selected, onSelect, onClose, onConfirm }: ReassignPoojariModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reassign poojari"
      description={contextLabel}
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button theme="primary" disabled={!selected} iconLeft={<Icon name="arrows-clockwise" size={15} />} onClick={onConfirm}>
            Confirm reassign
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.75 pb-1">
        <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Assign to (same or different)</span>
        {priests.map((name) => {
          const isSelected = selected === name
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              className={cn(
                'flex w-full items-center gap-2.75 rounded-lg border-none bg-card px-3 py-2.75 text-left hover:bg-hover',
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
              {currentPriest === name && (
                <span className="rounded-full bg-sunken px-2 py-0.5 text-2xs font-medium text-ink-subtle">Current</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex items-start gap-2 pb-1 text-xs leading-snug text-ink-muted">
        <Icon name="clock-countdown" size={16} color="var(--color-info)" className="mt-0.25 shrink-0" />
        The reassigned pooja must be completed within 24 hours. If not, it will need to be reassigned again.
      </div>
    </Modal>
  )
}
