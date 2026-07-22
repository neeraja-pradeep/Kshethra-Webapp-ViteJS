import { Button, Modal } from '@/shared/ui'

export type OrderConfirmKind = 'cancel-order' | 'partial-refund' | 'cancel-occurrence'

export interface OrderConfirmModalProps {
  open: boolean
  kind: OrderConfirmKind | null
  onCancel: () => void
  onConfirm: () => void
}

const COPY: Record<OrderConfirmKind, { title: string; body: string; action: string }> = {
  'cancel-order': {
    title: 'Cancel entire order?',
    body: 'All poojas in this order will be cancelled and the full amount auto-refunded. This can’t be undone.',
    action: 'Cancel & refund',
  },
  'partial-refund': {
    title: 'Record partial refund?',
    body: 'The selected poojas will be cancelled and a refund logged for reconciliation. This does not move money.',
    action: 'Record refund',
  },
  'cancel-occurrence': {
    title: 'Cancel this pooja?',
    body: 'This scheduled pooja will be cancelled. Record any refund separately from the row actions.',
    action: 'Cancel pooja',
  },
}

/** Shared confirm dialog for the order-level cancel/refund actions. */
export function OrderConfirmModal({ open, kind, onCancel, onConfirm }: OrderConfirmModalProps) {
  const copy = kind ? COPY[kind] : null
  return (
    <Modal
      open={open && !!copy}
      title={copy?.title}
      onClose={onCancel}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button theme="default" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button theme="danger" onClick={onConfirm}>
            {copy?.action}
          </Button>
        </div>
      }
    >
      <p className="m-0 mb-2.5 mt-0.5 leading-normal text-ink-muted">{copy?.body}</p>
    </Modal>
  )
}
