import { Button, Modal } from '@/shared/ui'

interface TrackConfirmModalProps {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

/** Shared confirm dialog for discard-changes / set-inactive / delete. */
export function TrackConfirmModal({ open, title, body, confirmLabel, onCancel, onConfirm }: TrackConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button theme="default" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button theme="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="m-0 mb-2.5 mt-0.5 leading-normal text-ink-muted">{body}</p>
    </Modal>
  )
}
