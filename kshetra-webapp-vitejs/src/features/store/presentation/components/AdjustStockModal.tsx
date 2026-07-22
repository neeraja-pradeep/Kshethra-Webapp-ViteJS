import { Button, Input, Modal } from '@/shared/ui'

export interface AdjustStockModalProps {
  open: boolean
  productName: string
  currentStock: number
  value: string
  reason: string
  error: string
  onValueChange: (v: string) => void
  onReasonChange: (v: string) => void
  onClose: () => void
  onSave: () => void
}

/** "Adjust stock" dialog — new quantity plus a required reason, logged to the product's history. */
export function AdjustStockModal({ open, productName, currentStock, value, reason, error, onValueChange, onReasonChange, onClose, onSave }: AdjustStockModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust stock"
      description={`${productName} · current ${currentStock}`}
      size="sm"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button theme="primary" onClick={onSave}>
            Save change
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5 py-1">
        <Input label="New stock quantity" type="number" min={0} value={value} onChange={(e) => onValueChange(e.target.value)} />
        <Input
          label="Reason"
          required
          type="text"
          placeholder="e.g. New stock received, damage, stock-take"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          error={error}
        />
      </div>
    </Modal>
  )
}
