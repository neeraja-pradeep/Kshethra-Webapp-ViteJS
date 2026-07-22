import { Icon } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'
import type { OrderLineItem } from '@/features/orders/domain/entities/order'
import { lineItemTotal } from '@/features/orders/presentation/lib/orderRollup'
import { OrderDateRow } from '@/features/orders/presentation/components/OrderDateRow'
import type { OccurrenceActionKind } from '@/features/orders/presentation/lib/occurrenceStatus'

export interface OrderPoojaSectionProps {
  item: OrderLineItem
  todayIso: string
  selectedOccurrenceIds: ReadonlySet<string>
  onToggleSelect: (occurrenceId: string) => void
  onOccurrenceAction: (occurrenceId: string, kind: OccurrenceActionKind) => void
}

/** One pooja within an order: god/pooja header, people booked, and every scheduled date. */
export function OrderPoojaSection({ item, todayIso, selectedOccurrenceIds, onToggleSelect, onOccurrenceAction }: OrderPoojaSectionProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-text">
          <Icon name="flame" size={18} />
        </span>
        <div className="min-w-0">
          <div className="text-base font-semibold text-ink-strong">{item.poojaName}</div>
          <div className="text-xs text-ink-subtle">{item.godName}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1.75">
        <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">People</span>
        <div className="flex flex-wrap gap-1.5">
          {item.people.map((p) => (
            <span key={p.name} className="inline-flex items-center gap-1.75 rounded-full bg-sunken px-2.75 py-1 text-xs shadow-xs">
              <span className="font-medium text-ink">{p.name}</span>
              <span className="text-stroke-strong">·</span>
              <span className="text-ink-subtle">{p.nakshatra}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">Scheduled dates</span>
        {item.occurrences.map((occ) => (
          <OrderDateRow
            key={occ.id}
            occurrence={occ}
            todayIso={todayIso}
            selected={selectedOccurrenceIds.has(occ.id)}
            onToggleSelect={() => onToggleSelect(occ.id)}
            onAction={(kind) => onOccurrenceAction(occ.id, kind)}
          />
        ))}
      </div>

      <div className="flex items-baseline justify-end gap-2 pt-0.5">
        <span className="text-xs text-ink-subtle">Section total</span>
        <span className="text-base font-bold tabular-nums text-ink-strong">{formatINR(lineItemTotal(item))}</span>
      </div>
    </div>
  )
}
