import type { ReactNode } from 'react'

import { Button, Modal } from '@/shared/ui'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel: string
  /** Danger styling for destructive/irreversible actions (default true). */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Shared yes/no confirmation for destructive or consequential store actions. */
export function ConfirmDialog({ open, title, body, confirmLabel, danger = true, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button theme={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="m-0 mb-2.5 mt-0.5 leading-normal text-ink-muted">{body}</p>
    </Modal>
  )
}
