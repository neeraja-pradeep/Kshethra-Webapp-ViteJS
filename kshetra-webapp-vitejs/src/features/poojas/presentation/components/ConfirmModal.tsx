import { Button, Modal } from '@/shared/ui'

export interface ConfirmModalProps {
  open: boolean
  title: string
  body: string
  actionLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Shared confirm dialog for discard / deactivate / delete / save-guard prompts. Always a danger action button, matching the source. */
export function ConfirmModal({ open, title, body, actionLabel, onConfirm, onCancel }: ConfirmModalProps) {
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
          <Button theme="danger" onClick={onConfirm}>
            {actionLabel}
          </Button>
        </>
      }
    >
      <p className="m-0 py-2.5 leading-normal text-ink-muted">{body}</p>
    </Modal>
  )
}
