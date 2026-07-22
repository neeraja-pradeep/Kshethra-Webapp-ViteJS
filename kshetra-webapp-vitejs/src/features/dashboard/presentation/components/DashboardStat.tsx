import type { StatTile } from '@/features/dashboard/domain/entities/stat-tile'

export interface DashboardStatProps {
  stat: StatTile
}

/** A single "value over label" stat, used in every section header. */
export function DashboardStat({ stat }: DashboardStatProps) {
  return (
    <div>
      <div className="text-2xl font-bold tabular-nums text-ink-strong">{stat.value}</div>
      <div className="mt-px text-xs font-medium text-ink-muted">{stat.label}</div>
    </div>
  )
}
