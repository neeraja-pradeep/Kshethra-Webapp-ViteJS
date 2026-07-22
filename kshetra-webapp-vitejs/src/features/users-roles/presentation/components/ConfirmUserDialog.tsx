import { Button, Modal } from '@/shared/ui'

export type ConfirmKind = 'discard' | 'deactivate' | 'delete'

export interface ConfirmUserDialogProps {
  open: boolean
  kind: ConfirmKind | null
  onConfirm: () => void
  onCancel: () => void
}

const COPY: Record<ConfirmKind, { title: string; body: string; action: string }> = {
  discard: { title: 'Discard changes?', body: 'Your unsaved changes to this user will be lost.', action: 'Discard' },
  deactivate: {
    title: 'Deactivate user?',
    body: 'This revokes their login immediately. Their record and history are preserved, and they can be reactivated later.',
    action: 'Deactivate',
  },
  delete: { title: 'Delete user?', body: 'This permanently removes the user from the registry. This can’t be undone.', action: 'Delete' },
}

/** Shared confirm modal for discard / deactivate / delete — the only difference is copy. */
export function ConfirmUserDialog({ open, kind, onConfirm, onCancel }: ConfirmUserDialogProps) {
  const copy = kind ? COPY[kind] : null
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={copy?.title ?? ''}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button theme="default" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button theme="danger" onClick={onConfirm}>
            {copy?.action ?? 'Confirm'}
          </Button>
        </div>
      }
    >
      <p className="m-0 mb-2.5 mt-0.5 leading-normal text-ink-muted">{copy?.body}</p>
    </Modal>
  )
}
