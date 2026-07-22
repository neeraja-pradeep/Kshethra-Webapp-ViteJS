import { Icon } from '@/shared/ui'
import { ActivityPanelHeader } from '@/features/users-roles/presentation/components/ActivityPanelHeader'
import { StatTile } from '@/features/users-roles/presentation/components/StatTile'
import type { UserMetrics } from '@/features/users-roles/domain/entities/user'

export interface PoojariActivityPanelProps {
  godNames: readonly string[]
  metrics: UserMetrics
}

/** Poojari detail panel: assigned gods + daily/monthly pooja counts. */
export function PoojariActivityPanel({ godNames, metrics }: PoojariActivityPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm">
      <ActivityPanelHeader icon={<Icon name="hands-praying" size={18} />} title="Poojari activity" />

      <div className="flex flex-col gap-2">
        <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Assigned gods</span>
        {godNames.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {godNames.map((name) => (
              <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.25 text-xs font-medium text-ink shadow-xs">
                <Icon name="flame" size={12} color="var(--color-primary)" />
                {name}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-ink-subtle">No gods assigned yet.</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <StatTile compact value={String(metrics.completedToday ?? 0)} label="Completed today" />
        <StatTile compact value={String(metrics.upcomingToday ?? 0)} label="Upcoming today" />
        <StatTile compact value={String(metrics.completedMonth ?? 0)} label="Completed this month" />
        <StatTile compact value={String(metrics.upcomingMonth ?? 0)} label="Upcoming this month" />
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-subtle">
        <Icon name="device-mobile" size={14} />
        No admin web access — this poojari uses the priest app only.
      </div>
    </div>
  )
}
