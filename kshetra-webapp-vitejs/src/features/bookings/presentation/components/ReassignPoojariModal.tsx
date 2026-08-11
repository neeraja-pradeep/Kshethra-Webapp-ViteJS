import { Alert, Button, Icon, Modal, Spinner } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import type { BookingPoojari } from '@/features/bookings/domain/entities/booking'

export interface ReassignPoojariModalProps {
  open: boolean
  contextLabel: string
  /** Activated poojaris only — the set the assign endpoint will accept. */
  poojaris: readonly BookingPoojari[]
  loading: boolean
  /** Null when the selection spans several poojaris, or nobody is assigned. */
  currentPoojariId: number | null
  selectedId: number | null
  saving: boolean
  error: string | null
  onSelect: (poojariId: number) => void
  onClose: () => void
  onConfirm: () => void
}

/** Reassign-poojari dialog — pick any poojari (including the current one). */
export function ReassignPoojariModal({
  open,
  contextLabel,
  poojaris,
  loading,
  currentPoojariId,
  selectedId,
  saving,
  error,
  onSelect,
  onClose,
  onConfirm,
}: ReassignPoojariModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reassign poojari"
      description={contextLabel}
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button
            theme="primary"
            disabled={selectedId === null || saving || loading}
            iconLeft={<Icon name="arrows-clockwise" size={15} />}
            onClick={onConfirm}
          >
            {saving ? 'Assigning…' : 'Confirm reassign'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="pb-2.5">
          <Alert type="danger" icon={<Icon name="warning" size={16} />}>
            {error}
          </Alert>
        </div>
      )}

      <div className="flex flex-col gap-1.75 pb-1">
        <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Assign to (same or different)</span>
        {loading && (
          <div className="flex justify-center py-5">
            <Spinner size={22} />
          </div>
        )}
        {!loading && poojaris.length === 0 && (
          <p className="m-0 py-2 text-sm text-ink-muted">
            No activated poojaris to assign to. A poojari must sign in once before work can be handed to them.
          </p>
        )}
        {poojaris.map((poojari) => {
          const isSelected = selectedId === poojari.id
          return (
            <button
              key={poojari.id}
              type="button"
              disabled={saving}
              onClick={() => onSelect(poojari.id)}
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
              <span className="flex-1 text-sm font-medium text-ink">{poojari.name}</span>
              {currentPoojariId === poojari.id && (
                <span className="rounded-full bg-sunken px-2 py-0.5 text-2xs font-medium text-ink-subtle">Current</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex items-start gap-2 pb-1 text-xs leading-snug text-ink-muted">
        <Icon name="clock-countdown" size={16} color="var(--color-info)" className="mt-px shrink-0" />
        The reassigned pooja must be completed within 24 hours. If not, it will need to be reassigned again.
      </div>
    </Modal>
  )
}
