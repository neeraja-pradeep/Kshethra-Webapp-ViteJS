import { Button, Modal } from '@/shared/ui'

interface ConfirmNotificationModalProps {
  open: boolean
  title: string
  body: string
  actionLabel: string
  onCancel: () => void
  onConfirm: () => void
}

/** Shared confirm dialog for discard / send-now / schedule actions. */
export function ConfirmNotificationModal({ open, title, body, actionLabel, onCancel, onConfirm }: ConfirmNotificationModalProps) {
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
          <Button theme="primary" onClick={onConfirm}>
            {actionLabel}
          </Button>
        </>
      }
    >
      <p className="m-0 text-ink-muted">{body}</p>
    </Modal>
  )
}
