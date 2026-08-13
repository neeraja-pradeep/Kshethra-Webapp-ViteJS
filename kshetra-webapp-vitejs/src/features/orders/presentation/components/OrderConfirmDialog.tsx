import type { ReactNode } from 'react'

import { Button, Modal } from '@/shared/ui'

export interface OrderConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  danger?: boolean
  submitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Confirmation for the actions that move money or close work off.
 *
 * Every one of them is all-or-nothing server-side, so the wording says what
 * will happen to the whole selection rather than implying a partial result is
 * possible.
 */
export function OrderConfirmDialog(props: OrderConfirmDialogProps) {
  return (
    <Modal
      open={props.open}
      onClose={props.onCancel}
      title={props.title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={props.onCancel} disabled={props.submitting}>
            Go back
          </Button>
          <Button
            theme={props.danger ? 'danger' : 'primary'}
            onClick={props.onConfirm}
            loading={props.submitting}
            disabled={props.submitting}
          >
            {props.confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-ink-muted">{props.children}</div>
    </Modal>
  )
}
