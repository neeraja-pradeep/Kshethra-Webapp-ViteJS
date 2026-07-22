import { cn } from '@/shared/lib/cn'

import type { BookingsTrendPoint } from '@/features/dashboard/domain/entities/chart-series-point'
import type { StatTile } from '@/features/dashboard/domain/entities/stat-tile'

import { DashboardStat } from './DashboardStat'
import { formatDayMonth, formatWeekdayShort } from '../lib/formatDashboardDate'

export interface PoojaBookingsPanelProps {
  stats: StatTile[]
  trend: BookingsTrendPoint[]
}

const BAR_MAX_HEIGHT = 118

/**
 * "Pooja bookings" card body: the stat column (poojas today / next 7 days /
 * collected this month) beside the next-7-day booking bar chart. Bar
 * heights are computed from the series max — the one genuinely dynamic
 * numeric value in this component.
 */
export function PoojaBookingsPanel({ stats, trend }: PoojaBookingsPanelProps) {
  const maxCount = Math.max(1, ...trend.map((point) => point.count))

  return (
    <div className="grid grid-cols-[180px_minmax(0,1fr)] items-stretch gap-5.5">
      <div className="flex flex-col justify-between gap-3 border-r-[0.5px] border-stroke-subtle pr-5">
        {stats.map((stat) => (
          <DashboardStat key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="text-2xs font-medium text-ink-muted">Bookings per day — next 7 days</div>
        <div className="flex min-h-[138px] flex-1 items-end gap-2.5">
          {trend.map((point) => {
            const heightPx = point.count ? Math.max(10, Math.round((BAR_MAX_HEIGHT * point.count) / maxCount)) : 3
            return (
              <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.25">
                <span className={cn('text-xs font-semibold tabular-nums', point.count ? 'text-ink-strong' : 'text-ink-subtle')}>
                  {point.count}
                </span>
                <div
                  className={cn('w-full max-w-11 rounded-t-md rounded-b-[2px]', point.isToday ? 'bg-primary' : 'bg-primary-border')}
                  style={{ height: `${heightPx}px` }}
                />
                <div className="text-center leading-tight">
                  <div className={cn('text-2xs', point.isToday ? 'font-semibold text-primary' : 'font-normal text-ink')}>
                    {point.isToday ? 'Today' : formatWeekdayShort(point.date)}
                  </div>
                  <div className="text-2xs text-ink-subtle">{formatDayMonth(point.date)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
