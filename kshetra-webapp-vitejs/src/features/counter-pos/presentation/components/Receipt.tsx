import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Button, Icon } from '@/shared/ui'

import type { ReceiptPage } from '@/features/counter-pos/presentation/lib/receipt'

const COLS = 'grid-cols-[22px_1.05fr_0.8fr_1.35fr_78px_64px]'

export interface ReceiptProps {
  open: boolean
  pages: readonly ReceiptPage[]
  closeLabel: string
  onClose: () => void
  onPrint: () => void
}

/** A5 pooja receipt — one printable page per god, with hairline rules throughout. */
export function Receipt({ open, pages, closeLabel, onClose, onPrint }: ReceiptProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-auto bg-overlay p-6 [backdrop-filter:blur(2px)] print:static print:bg-transparent print:p-0 print:[backdrop-filter:none]">
      <div className="ks-print-region mx-auto flex flex-col items-center gap-4">
        {pages.map((pg) => (
          <div
            key={pg.god}
            className="flex min-h-[652px] w-[462px] flex-col rounded-xl bg-card px-8.5 py-8 shadow-xl print:m-0 print:break-inside-avoid print:shadow-none"
          >
            <div className="pb-3 text-center">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xl font-black leading-none text-primary-contrast">
                क
              </span>
              <div className="mt-1.75 text-lg font-bold text-ink-strong">{pg.temple}</div>
              <div className="mt-px text-2xs text-ink-subtle">Pooja receipt</div>
            </div>

            <div className="flex flex-col gap-1 border-y border-stroke py-2.5 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-ink-subtle">Invoice no</span>
                <span className="font-semibold tabular-nums text-ink-strong">{pg.invoiceNo}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-subtle">Date &amp; time</span>
                <span className="text-ink">{pg.dateTime}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-subtle">Counter</span>
                <span className="text-ink">
                  {pg.counter} · paid by {pg.method}
                </span>
              </div>
            </div>

            <div className="py-3.5 text-center text-lg font-semibold text-primary">{pg.god}</div>

            <div className={cn('grid', COLS, 'gap-1.5 border-t border-stroke-strong border-b border-stroke py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-subtle')}>
              <span>Sl</span>
              <span>Name</span>
              <span>Nakshatra</span>
              <span>Pooja</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
            </div>
            {pg.rows.map((r) => (
              <div key={r.sl} className={cn('grid', COLS, 'items-baseline gap-1.5 border-b border-stroke-subtle py-1.75 text-xs text-ink')}>
                <span className="tabular-nums text-ink-subtle">{r.sl}</span>
                <span className="font-medium text-ink-strong">{r.name}</span>
                <span>{r.nakshatra}</span>
                <span>{r.pooja}</span>
                <span className="tabular-nums">{r.date}</span>
                <span className="text-right font-medium tabular-nums">{formatINR(r.amount)}</span>
              </div>
            ))}

            <div className="flex items-baseline justify-end gap-3.5 py-2.5">
              <span className="text-sm font-semibold text-ink-strong">Total</span>
              <span className="text-xl font-bold tabular-nums text-ink-strong">{formatINR(pg.total)}</span>
            </div>

            <div className="flex-1" />

            <div className="flex flex-col gap-1.5 pt-2.5">
              <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">Remarks</span>
              <div className="min-h-[92px] rounded-md border border-stroke-strong px-3 py-2.25 text-xs leading-normal text-ink">{pg.remarks}</div>
            </div>

            <div className="pt-3 text-center text-2xs text-ink-subtle">
              {pg.pageLabel} · Thank you · {'शुभमस्तु'}
            </div>
          </div>
        ))}

        <div className="flex gap-2.5 pb-2 print:hidden">
          <Button theme="default" variant="outline" onClick={onClose}>
            {closeLabel}
          </Button>
          <Button theme="primary" onClick={onPrint} iconLeft={<Icon name="printer" size={16} />}>
            Print receipt
          </Button>
        </div>
      </div>
    </div>
  )
}
