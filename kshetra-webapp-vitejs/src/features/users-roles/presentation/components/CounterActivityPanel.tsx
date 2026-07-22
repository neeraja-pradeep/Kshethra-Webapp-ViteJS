import { Icon } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'
import { ActivityPanelHeader } from '@/features/users-roles/presentation/components/ActivityPanelHeader'
import { StatTile } from '@/features/users-roles/presentation/components/StatTile'
import type { UserMetrics } from '@/features/users-roles/domain/entities/user'

export interface CounterActivityPanelProps {
  metrics: UserMetrics
}

/** Counter staff detail panel: bookings, collection handled, transactions — this month. */
export function CounterActivityPanel({ metrics }: CounterActivityPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm">
      <ActivityPanelHeader
        icon={<Icon name="receipt" size={18} />}
        title="Counter activity"
        trailing={<span className="rounded-full bg-sunken px-2.5 py-1 text-xs text-ink-subtle">This month</span>}
      />
      <div className="flex flex-wrap gap-2.5">
        <StatTile value={String(metrics.bookingsTaken ?? 0)} label="Bookings taken" />
        <StatTile value={formatINR(metrics.collectionHandled ?? 0)} label="Collection handled" />
        <StatTile value={String(metrics.transactions ?? 0)} label="Transactions" />
      </div>
    </div>
  )
}
