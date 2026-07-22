import { cn } from '@/shared/lib/cn'

import type { KpiItem } from '@/features/devotees/presentation/lib/kpis'

export interface DevoteesKpiBandProps {
  items: readonly KpiItem[]
}

/** Row of small metric pills summarising the filtered devotee list. */
export function DevoteesKpiBand({ items }: DevoteesKpiBandProps) {
  return (
    <div className="flex flex-wrap gap-2.5 px-7 pb-3.5">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2.25 rounded-lg bg-card px-3.75 py-2.75 shadow-xs">
          {item.dotClassName && <span className={cn('h-2 w-2 shrink-0 rounded-full', item.dotClassName)} />}
          <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{item.value}</span>
          <span className="text-2xs text-ink-subtle">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
