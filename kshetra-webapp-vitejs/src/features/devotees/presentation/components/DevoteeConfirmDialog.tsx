import { Button, Modal } from '@/shared/ui'

/**
 * The two things the screen writes. There is no `delete`: an account with
 * receipts against it has to stay attributable, which is why the server offers
 * suspension and nothing else.
 */
export type DevoteeConfirmKind = 'suspend' | 'reinstate'

const COPY: Record<DevoteeConfirmKind, { title: string; body: string; action: string; danger: boolean }> = {
  suspend: {
    title: 'Suspend account?',
    body: 'The devotee will be signed out on their next request and cannot sign in again until reinstated. Their family, bookings and receipts are untouched.',
    action: 'Suspend',
    danger: true,
  },
  reinstate: {
    title: 'Reinstate account?',
    body: 'The devotee will be able to sign in again.',
    action: 'Reinstate',
    danger: false,
  },
}

export interface DevoteeConfirmDialogProps {
  kind: DevoteeConfirmKind | null
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Confirm dialog for suspending or reinstating an account. */
export function DevoteeConfirmDialog({ kind, busy, onConfirm, onCancel }: DevoteeConfirmDialogProps) {
  const copy = kind ? COPY[kind] : null

  return (
    <Modal
      open={!!kind}
      onClose={onCancel}
      title={copy?.title}
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button theme={copy?.danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {copy?.action}
          </Button>
        </>
      }
    >
      <p className="m-0 py-2.5 leading-normal text-ink-muted">{copy?.body}</p>
    </Modal>
  )
}
