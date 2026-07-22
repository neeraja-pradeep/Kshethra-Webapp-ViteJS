import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'

import type { CounterCollectionPoint } from '@/features/dashboard/domain/entities/chart-series-point'
import type { StatTile } from '@/features/dashboard/domain/entities/stat-tile'

import { DashboardStat } from './DashboardStat'
import { formatWeekdayShort } from '../lib/formatDashboardDate'

export interface CounterCollectionsPanelProps {
  stats: StatTile[]
  collections: CounterCollectionPoint[]
}

const BAR_MAX_HEIGHT = 60

/**
 * "Counter bookings" card body: the collection/receipts/booked stat row
 * above the last-7-day collections mini bar chart. Bar heights are the
 * one genuinely dynamic value, derived from the series max.
 */
export function CounterCollectionsPanel({ stats, collections }: CounterCollectionsPanelProps) {
  const maxAmount = Math.max(1, ...collections.map((point) => point.amount))

  return (
    <>
      <div className="flex gap-6.5">
        {stats.map((stat) => (
          <DashboardStat key={stat.label} stat={stat} />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-end gap-1.5">
        <div className="text-2xs font-medium text-ink-muted">Counter collections — last 7 days</div>
        <div className="flex min-h-18 items-end gap-2">
          {collections.map((point) => {
            const heightPx = Math.max(6, Math.round((BAR_MAX_HEIGHT * point.amount) / maxAmount))
            return (
              <div key={point.date} title={formatINR(point.amount)} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <div
                  className={cn('w-full max-w-8 rounded-t-sm rounded-b-[2px]', point.isToday ? 'bg-primary' : 'bg-primary-border')}
                  style={{ height: `${heightPx}px` }}
                />
                <span className={cn('text-2xs', point.isToday ? 'font-semibold text-primary' : 'font-normal text-ink-subtle')}>
                  {point.isToday ? 'Today' : formatWeekdayShort(point.date)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
