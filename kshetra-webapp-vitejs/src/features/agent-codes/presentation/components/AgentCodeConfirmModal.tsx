import { Button, Modal } from '@/shared/ui'

export type AgentCodeConfirmKind = 'discard' | 'deactivate' | 'delete'

export interface AgentCodeConfirmModalProps {
  open: boolean
  kind: AgentCodeConfirmKind | null
  onConfirm: () => void
  onCancel: () => void
}

const COPY: Record<AgentCodeConfirmKind, { title: string; body: string; action: string }> = {
  discard: { title: 'Discard changes?', body: 'Your unsaved changes to this code will be lost.', action: 'Discard' },
  deactivate: { title: 'Deactivate code?', body: 'Devotees won’t be able to apply this code in the app until it’s reactivated.', action: 'Deactivate' },
  delete: { title: 'Delete code?', body: 'This code will be permanently removed. This can’t be undone.', action: 'Delete' },
}

/** Shared yes/no confirmation for discard, deactivate, and delete actions. */
export function AgentCodeConfirmModal({ open, kind, onConfirm, onCancel }: AgentCodeConfirmModalProps) {
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
