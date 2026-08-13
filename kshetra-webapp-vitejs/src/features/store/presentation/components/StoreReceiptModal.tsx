import { Alert, Button, Icon, Spinner } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatINR, formatOrderDateTime } from '@/shared/lib/format'

import type { StoreReceipt } from '@/features/store/domain/entities/store-receipt'

const COLS = 'grid-cols-[22px_1fr_54px_78px_78px]'

export interface StoreReceiptModalProps {
  open: boolean
  receipt: StoreReceipt | undefined
  loading: boolean
  errorMessage: string | null
  onClose: () => void
}

function printReceipt() {
  try {
    window.print()
  } catch {
    /* printing unavailable in this environment */
  }
}

/**
 * The shop receipt, for either channel.
 *
 * A walk-in carries a real `SRCP-` number and the staff member who took the
 * money; an app order has neither, so the server composes one numbered
 * `RCP-SO-<id>` from the order itself. Both arrive in one shape.
 *
 * `ks-print-region` is the app-wide convention that hides everything outside
 * this node at print time — the old store modal called `window.print()` with no
 * isolation and printed the whole page.
 */
export function StoreReceiptModal({ open, receipt, loading, errorMessage, onClose }: StoreReceiptModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-auto bg-overlay p-6 [backdrop-filter:blur(2px)] print:static print:bg-transparent print:p-0 print:[backdrop-filter:none]">
      <div className="mx-auto flex flex-col items-center gap-4">
        {errorMessage && (
          <div className="w-[462px] print:hidden">
            <Alert type="danger">{errorMessage}</Alert>
          </div>
        )}

        {loading && !receipt && (
          <div className="flex w-[462px] flex-col items-center gap-3 rounded-xl bg-card px-8.5 py-12 text-ink-subtle shadow-xl print:hidden">
            <Spinner size={28} />
            <span className="text-sm">Loading receipt…</span>
          </div>
        )}

        {receipt && (
          <div className="ks-print-region flex flex-col items-center">
            <div className="flex min-h-[560px] w-[462px] flex-col rounded-xl bg-card px-8.5 py-8 shadow-xl print:m-0 print:break-inside-avoid print:shadow-none">
              <div className="pb-3 text-center">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xl font-black leading-none text-primary-contrast">
                  क
                </span>
                <div className="mt-1.75 text-lg font-bold text-ink-strong">Kshetra</div>
                <div className="mt-px text-2xs text-ink-subtle">Store receipt</div>
              </div>

              <div className="flex flex-col gap-1 border-y border-stroke py-2.5 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Receipt no</span>
                  <span className="font-semibold tabular-nums text-ink-strong">{receipt.receiptNo}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Order</span>
                  <span className="text-ink">{receipt.order.reference}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Date &amp; time</span>
                  <span className="text-ink">{formatOrderDateTime(receipt.issuedAt)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Paid by</span>
                  <span className="text-ink">
                    {receipt.paymentMethodDisplay || receipt.paymentMethod || '—'}
                    {/* Only ever set on a walk-in — an app payment had nobody at a desk. */}
                    {receipt.staffName ? ` · ${receipt.staffName}` : ''}
                  </span>
                </div>
              </div>

              {receipt.payer && (receipt.payer.name || receipt.payer.phone) && (
                <div className="py-2.5 text-center">
                  <div className="text-sm font-semibold text-ink-strong">{receipt.payer.name || 'Walk-in'}</div>
                  {receipt.payer.phone && <div className="text-2xs text-ink-subtle">{receipt.payer.phone}</div>}
                </div>
              )}

              <div
                className={cn(
                  'grid',
                  COLS,
                  'gap-1.5 border-b border-stroke border-t border-stroke-strong py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-subtle',
                )}
              >
                <span>Sl</span>
                <span>Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
              </div>

              {receipt.items.map((item, index) => (
                <div
                  key={`${item.sku}-${index}`}
                  className={cn('grid', COLS, 'items-baseline gap-1.5 border-b border-stroke-subtle py-1.75 text-xs text-ink')}
                >
                  <span className="tabular-nums text-ink-subtle">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink-strong">{item.name}</span>
                    {item.sku && <span className="block font-mono text-2xs text-ink-subtle">{item.sku}</span>}
                  </span>
                  <span className="text-right tabular-nums">{item.quantity}</span>
                  <span className="text-right tabular-nums">{formatINR(item.unitPrice)}</span>
                  <span className="text-right font-medium tabular-nums">{formatINR(item.amount)}</span>
                </div>
              ))}

              <div className="flex flex-col gap-1 py-2.5 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Subtotal (goods)</span>
                  <span className="tabular-nums text-ink">{formatINR(receipt.subtotal)}</span>
                </div>
                {/* On an app order `total` includes the delivery fee added at checkout. */}
                {receipt.total !== receipt.subtotal && (
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-subtle">Delivery &amp; charges</span>
                    <span className="tabular-nums text-ink">{formatINR(receipt.total - receipt.subtotal)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-3 border-t border-stroke pt-1.5">
                  <span className="text-sm font-semibold text-ink-strong">Total charged</span>
                  <span className="text-lg font-bold tabular-nums text-ink-strong">{formatINR(receipt.total)}</span>
                </div>

                {receipt.refundAmount > 0 && (
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-ink-subtle">Refunded</span>
                      <span className="tabular-nums text-ink">−{formatINR(receipt.refundAmount)}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 border-t border-stroke pt-1.5">
                      <span className="text-sm font-semibold text-ink-strong">Net kept</span>
                      <span className="text-lg font-bold tabular-nums text-ink-strong">
                        {formatINR(receipt.netTotal)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {receipt.cancellation?.cancelled && (
                <div className="rounded-md border border-danger-border px-3 py-2 text-2xs text-danger-strong">
                  Order cancelled{receipt.cancellation.reason ? ` — ${receipt.cancellation.reason}` : ''}
                </div>
              )}

              <div className="flex-1" />
              <div className="pt-3 text-center text-2xs text-ink-subtle">Thank you · {'शुभमस्तु'}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2.5 pb-2 print:hidden">
          <Button theme="default" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button theme="primary" onClick={printReceipt} disabled={!receipt} iconLeft={<Icon name="printer" size={16} />}>
            Print receipt
          </Button>
        </div>
      </div>
    </div>
  )
}
