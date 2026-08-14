import { Button, Modal } from '@/shared/ui'

/** Where the delete flow has got to. */
export type DeleteRoleStage =
  | { readonly kind: 'closed' }
  | { readonly kind: 'confirm' }
  /** The server refused: the role is still held. Its wording, its count. */
  | { readonly kind: 'stillAssigned'; readonly detail: string; readonly userCount: number }

export interface DeleteRoleDialogProps {
  stage: DeleteRoleStage
  roleLabel: string
  deleting: boolean
  onCancel: () => void
  onConfirm: (force: boolean) => void
}

/**
 * Deleting a role, in the two steps the server asks for.
 *
 * A `409` here is not an error — it is the server asking a question the
 * operator has to answer, and the repository already turns it into a
 * `stillAssigned` outcome rather than a failure. So the second step is drawn
 * as a question with a real count in it, not as a red toast the operator has
 * to interpret.
 */
export function DeleteRoleDialog({ stage, roleLabel, deleting, onCancel, onConfirm }: DeleteRoleDialogProps) {
  if (stage.kind === 'closed') return null

  const assigned = stage.kind === 'stillAssigned'
  const holders = assigned ? stage.userCount : 0

  return (
    <Modal
      open
      onClose={deleting ? undefined : onCancel}
      title={assigned ? `${roleLabel} is still assigned` : `Delete ${roleLabel}?`}
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button theme="danger" loading={deleting} onClick={() => onConfirm(assigned)}>
            {assigned
              ? `Delete and revoke from ${holders} ${holders === 1 ? 'user' : 'users'}`
              : 'Delete role'}
          </Button>
        </>
      }
    >
      {assigned ? (
        <div className="flex flex-col gap-2">
          {/* The server's own sentence — it names the count authoritatively. */}
          <p className="m-0 text-sm leading-normal text-ink-muted">{stage.detail}</p>
          <p className="m-0 text-sm leading-normal text-ink-muted">
            Deleting it anyway removes its permissions from {holders === 1 ? 'that user' : 'those users'} on their next
            request. Their accounts and base roles are untouched.
          </p>
        </div>
      ) : (
        <p className="m-0 text-sm leading-normal text-ink-muted">
          Its permissions are removed from anyone who holds it. This cannot be undone — a role with the same name would
          have to be built again.
        </p>
      )}
    </Modal>
  )
}
