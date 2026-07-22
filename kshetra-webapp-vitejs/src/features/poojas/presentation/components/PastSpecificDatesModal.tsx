import { formatINR } from '@/shared/lib/format'
import { Modal } from '@/shared/ui'

import type { SpecificDate } from '../../domain/entities/pooja'
import { humanDate, todayISO } from '../lib/dateUtils'

export interface PastSpecificDatesModalProps {
  open: boolean
  dates: readonly SpecificDate[]
  onClose: () => void
}

/** Completed one-off dates and the pricing that applied on each — the "N past dates" history pill opens this. */
export function PastSpecificDatesModal({ open, dates, onClose }: PastSpecificDatesModalProps) {
  const today = todayISO()
  const past = dates
    .filter((d) => d.date < today)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Modal open={open} onClose={onClose} title="Past specific dates" description="Completed one-off dates and the pricing that applied on each." size="sm">
      <div className="flex flex-col gap-1.5 py-0.5 pb-2">
        {past.map((d) => (
          <div key={d.date} className="flex flex-wrap items-center gap-2 rounded-md bg-sunken px-3 py-2.5">
            <span className="min-w-24 flex-1 text-sm font-medium text-ink-strong">{humanDate(d.date)}</span>
            <div className="flex min-w-14 flex-col gap-0.5">
              <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Offline</span>
              <span className="text-sm tabular-nums text-ink-strong">{formatINR(d.offlinePrice)}</span>
            </div>
            <div className="flex min-w-14 flex-col gap-0.5">
              <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Online</span>
              <span className="text-sm tabular-nums text-ink-strong">{formatINR(d.onlinePrice)}</span>
            </div>
            <div className="flex min-w-14 flex-col gap-0.5">
              <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Incentive</span>
              <span className="text-sm tabular-nums text-ink-strong">{d.incentive ? formatINR(d.incentive) : '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
