import { Alert, Button, Modal, Spinner } from '@/shared/ui'

import type { OrderPersonRef } from '@/features/orders/domain/entities/pooja-order-detail'

export interface OrderAssignPoojariModalProps {
  open: boolean
  /** What is being assigned, e.g. "Ganapathi Homa · 30 Jul 2026". */
  contextLabel: string
  poojaris: readonly OrderPersonRef[]
  loading: boolean
  errorMessage: string | null
  currentPoojariId: number | null
  selectedId: number | null
  onSelect: (poojariId: number) => void
  onClose: () => void
  onConfirm: () => void
  submitting: boolean
}

/**
 * Picks the poojari for one booking.
 *
 * The roster is only ever the activated `temple_poojari` accounts the assign
 * endpoint will accept — offering anyone else would be an error the operator
 * could not have avoided. Reassigning restarts that booking's 24-hour window.
 */
export function OrderAssignPoojariModal(props: OrderAssignPoojariModalProps) {
  const unchanged = props.selectedId == null || props.selectedId === props.currentPoojariId

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.currentPoojariId == null ? 'Assign poojari' : 'Reassign poojari'}
      description={props.contextLabel}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={props.onClose} disabled={props.submitting}>
            Cancel
          </Button>
          <Button onClick={props.onConfirm} disabled={unchanged || props.submitting} loading={props.submitting}>
            {props.currentPoojariId == null ? 'Assign' : 'Reassign'}
          </Button>
        </div>
      }
    >
      {props.errorMessage && <Alert type="danger">{props.errorMessage}</Alert>}

      {props.loading ? (
        <div className="flex items-center justify-center gap-2.5 py-8 text-ink-subtle">
          <Spinner size={20} />
          <span className="text-sm">Loading poojaris…</span>
        </div>
      ) : props.poojaris.length === 0 ? (
        <p className="m-0 py-4 text-sm text-ink-muted">
          No activated poojaris are available to take this booking.
        </p>
      ) : (
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto py-1">
          {props.poojaris.map((poojari) => {
            const active = props.selectedId === poojari.id
            const current = props.currentPoojariId === poojari.id
            return (
              <button
                key={poojari.id}
                type="button"
                onClick={() => props.onSelect(poojari.id)}
                aria-pressed={active}
                className={`flex cursor-pointer items-center justify-between rounded-lg border-none px-3 py-2.5 text-left font-sans text-sm hover:bg-hover ${
                  active ? 'bg-primary-subtle text-primary-subtle-text' : 'bg-transparent text-ink'
                }`}
              >
                <span className="font-medium">{poojari.name}</span>
                {current && <span className="text-xs text-ink-subtle">Currently assigned</span>}
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
