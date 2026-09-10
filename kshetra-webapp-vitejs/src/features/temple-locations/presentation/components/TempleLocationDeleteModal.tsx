import { Alert, Button, Icon, Modal } from '@/shared/ui'

export interface TempleLocationDeleteModalProps {
  open: boolean
  name: string
  /** True when this is the last active site — deleting it stops every mark. */
  isLastActive: boolean
  deleting: boolean
  error?: string | null
  onConfirm: () => void
  onDeactivateInstead: () => void
  onCancel: () => void
}

/**
 * Deleting is the destructive option and the UI says so.
 *
 * Any poojari assigned to this site has their assignment silently cleared, and
 * if it was the only active one every mark starts failing — so deactivating is
 * offered as the primary action and delete is the one you have to reach for.
 */
export function TempleLocationDeleteModal({
  open,
  name,
  isLastActive,
  deleting,
  error = null,
  onConfirm,
  onDeactivateInstead,
  onCancel,
}: TempleLocationDeleteModalProps) {
  return (
    <Modal
      open={open}
      onClose={deleting ? undefined : onCancel}
      size="sm"
      title={`Delete ${name}?`}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button theme="default" variant="outline" disabled={deleting} onClick={onCancel}>
            Cancel
          </Button>
          <Button theme="primary" variant="subtle" disabled={deleting} onClick={onDeactivateInstead}>
            Deactivate instead
          </Button>
          <Button theme="danger" disabled={deleting} onClick={onConfirm}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-sm text-ink">
        <p className="m-0">
          This removes the site permanently. Any poojari assigned to it has that assignment cleared,
          and attendance history stops naming where it was marked from.
        </p>
        {isLastActive && (
          <Alert type="danger" icon={<Icon name="warning" size={16} />} title="This is the last active site">
            With no active site left, every same-day present mark will be refused.
          </Alert>
        )}
        <p className="m-0 text-ink-subtle">
          Deactivating keeps the row, its assignments and its history intact.
        </p>
        {error && (
          <Alert type="danger" icon={<Icon name="warning" size={16} />}>
            {error}
          </Alert>
        )}
      </div>
    </Modal>
  )
}
