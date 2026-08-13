import { Alert, Button, Icon, Spinner } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

import type { OrderReceipt } from '@/features/orders/domain/entities/pooja-receipt'
import { formatOrderDateTime, formatOrderDay } from '@/shared/lib/format'

const COLS = 'grid-cols-[22px_1.5fr_1fr_86px_72px]'

export interface OrderReceiptModalProps {
  open: boolean
  receipt: OrderReceipt | undefined
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
 * The order's receipt, for both channels.
 *
 * A counter walk-in has a real `CounterReceipt` on file; an app order never had
 * one printed at a desk, so the server composes it from the order and numbers
 * it `RCP-PO-<id>` to keep it out of the counter's own series. The two arrive in
 * one shape and render through this one template.
 *
 * The figures are **as billed and stay that way** — a cancellation does not
 * rewrite what the devotee was charged. What came back is shown underneath as
 * its own lines, and `netTotal` is what the temple kept.
 */
export function OrderReceiptModal({ open, receipt, loading, errorMessage, onClose }: OrderReceiptModalProps) {
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
            <div className="flex min-h-[652px] w-[462px] flex-col rounded-xl bg-card px-8.5 py-8 shadow-xl print:m-0 print:break-inside-avoid print:shadow-none">
              <div className="pb-3 text-center">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xl font-black leading-none text-primary-contrast">
                  क
                </span>
                <div className="mt-1.75 text-lg font-bold text-ink-strong">Kshetra</div>
                <div className="mt-px text-2xs text-ink-subtle">Pooja receipt</div>
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
                    {/* Only ever set on a counter sale — an app payment went to
                        the gateway, with nobody at a desk. */}
                    {receipt.staffName ? ` · ${receipt.staffName}` : ''}
                  </span>
                </div>
                {receipt.order.agentCode && (
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-subtle">Agent code</span>
                    <span className="text-ink">{receipt.order.agentCode}</span>
                  </div>
                )}
              </div>

              {receipt.payer && (
                <div className="py-2.5 text-center">
                  <div className="text-sm font-semibold text-ink-strong">{receipt.payer.name || '—'}</div>
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
                <span>Pooja</span>
                <span>For</span>
                <span>Dates</span>
                <span className="text-right">Amount</span>
              </div>

              {receipt.items.map((item, index) => (
                <div
                  key={`${item.poojaId ?? item.name}-${index}`}
                  className={cn('grid', COLS, 'items-baseline gap-1.5 border-b border-stroke-subtle py-1.75 text-xs text-ink')}
                >
                  <span className="tabular-nums text-ink-subtle">{index + 1}</span>
                  <span className="font-medium text-ink-strong">
                    {item.name}
                    {item.god && <span className="block text-2xs font-normal text-ink-subtle">{item.god}</span>}
                    {/* Cancelled dates stay on the receipt: it records what was
                        billed, not what survived. */}
                    {item.cancelledCount > 0 && (
                      <span className="block text-2xs font-normal text-danger">
                        {item.cancelledCount} cancelled
                      </span>
                    )}
                  </span>
                  <span>
                    {item.people.map((person) => person.name).filter(Boolean).join(', ') || '—'}
                    {item.peopleCount > 1 && (
                      <span className="block text-2xs text-ink-subtle">{item.peopleCount} people</span>
                    )}
                  </span>
                  <span className="tabular-nums">
                    {item.dates.length > 0 ? item.dates.map((d) => formatOrderDay(d)).join(', ') : '—'}
                  </span>
                  <span className="text-right font-medium tabular-nums">{formatINR(item.amount)}</span>
                </div>
              ))}

              <div className="flex flex-col gap-1 py-2.5 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Subtotal</span>
                  <span className="tabular-nums text-ink">{formatINR(receipt.subtotal)}</span>
                </div>
                {receipt.additionalCharges > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-subtle">Additional charges</span>
                    <span className="tabular-nums text-ink">{formatINR(receipt.additionalCharges)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-3 border-t border-stroke pt-1.5">
                  <span className="text-sm font-semibold text-ink-strong">Total billed</span>
                  <span className="text-lg font-bold tabular-nums text-ink-strong">{formatINR(receipt.total)}</span>
                </div>

                {(receipt.refundAmount > 0 || receipt.reconciledAmount > 0) && (
                  <>
                    {receipt.refundAmount > 0 && (
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-subtle">Refunded via gateway</span>
                        <span className="tabular-nums text-ink">−{formatINR(receipt.refundAmount)}</span>
                      </div>
                    )}
                    {receipt.reconciledAmount > 0 && (
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-subtle">Reconciled by hand</span>
                        <span className="tabular-nums text-ink">−{formatINR(receipt.reconciledAmount)}</span>
                      </div>
                    )}
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

              <div className="pt-3 text-center text-2xs text-ink-subtle">
                {receipt.poojaCount} of {receipt.poojaCountBilled} poojas standing · Thank you · {'शुभमस्तु'}
              </div>
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
