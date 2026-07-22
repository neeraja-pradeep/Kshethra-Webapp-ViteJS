import { Button, Modal } from '@/shared/ui'

export type DevoteeConfirmKind = 'discard' | 'suspend' | 'delete'

const COPY: Record<DevoteeConfirmKind, { title: string; body: string; action: string }> = {
  discard: { title: 'Discard changes?', body: 'Your unsaved edits to this account will be lost.', action: 'Discard' },
  suspend: { title: 'Suspend account?', body: 'The devotee will lose app access until reactivated. Their history is preserved.', action: 'Suspend' },
  delete: { title: 'Delete account?', body: 'This account will be permanently removed. This can’t be undone.', action: 'Delete' },
}

export interface DevoteeConfirmDialogProps {
  kind: DevoteeConfirmKind | null
  onConfirm: () => void
  onCancel: () => void
}

/** Shared confirm dialog for discarding edits, suspending, or deleting an account. */
export function DevoteeConfirmDialog({ kind, onConfirm, onCancel }: DevoteeConfirmDialogProps) {
  const copy = kind ? COPY[kind] : null

  return (
    <Modal
      open={!!kind}
      onClose={onCancel}
      title={copy?.title}
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button theme="danger" onClick={onConfirm}>
            {copy?.action}
          </Button>
        </>
      }
    >
      <p className="m-0 py-2.5 leading-normal text-ink-muted">{copy?.body}</p>
    </Modal>
  )
}
