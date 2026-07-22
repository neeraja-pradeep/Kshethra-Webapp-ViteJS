import { formatINR } from '@/shared/lib/format'
import { Badge, Icon, Input } from '@/shared/ui'

import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'

export interface CounterPaymentsListProps {
  search: string
  onSearchChange: (value: string) => void
  rows: readonly AgentBooking[]
  onSelect: (orderRef: string) => void
}

/** Search + row list of app agent-code bookings that are payable (or paid) at the counter. */
export function CounterPaymentsList({ search, onSearchChange, rows, onSelect }: CounterPaymentsListProps) {
  return (
    <>
      <div className="flex-shrink-0 px-5.5 pb-2.5 pt-3">
        <Input
          size="sm"
          placeholder="Search order ref, code, devotee, phone, pooja…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={15} />}
          autoFocus
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex gap-3 border-b border-stroke px-5.5 py-2.25 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
          <span className="w-[86px] flex-shrink-0">Order</span>
          <span className="flex-1">Devotee · pooja</span>
          <span className="w-24 flex-shrink-0">Code</span>
          <span className="w-[82px] flex-shrink-0 text-right">Amount</span>
          <span className="w-[92px] flex-shrink-0 text-right">Payment</span>
        </div>
        {rows.map((r) => (
          <button
            key={r.orderRef}
            type="button"
            onClick={() => onSelect(r.orderRef)}
            className="flex w-full items-center gap-3 border-none border-b border-stroke-subtle bg-transparent px-5.5 py-2.75 text-left text-sm transition-[background] duration-120 ease-ks hover:bg-hover"
          >
            <span className="w-[86px] flex-shrink-0 font-semibold text-ink-strong">{r.orderRef}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="truncate text-ink-strong">{r.devotee}</span>
              <span className="truncate text-xs text-ink-subtle">{r.poojaSummary}</span>
            </span>
            <span className="w-24 flex-shrink-0 font-mono text-xs font-medium text-ink-muted">{r.code}</span>
            <span className="w-[82px] flex-shrink-0 text-right font-semibold tabular-nums text-ink-strong">{formatINR(r.amount)}</span>
            <span className="flex w-[92px] flex-shrink-0 justify-end">
              <Badge color={r.paid ? 'green' : 'amber'} size="sm">
                {r.paid ? 'Paid' : 'Payable'}
              </Badge>
            </span>
          </button>
        ))}
        {rows.length === 0 && <div className="px-8.5 py-8.5 text-center text-sm text-ink-subtle">No app agent-code bookings match.</div>}
      </div>
    </>
  )
}
