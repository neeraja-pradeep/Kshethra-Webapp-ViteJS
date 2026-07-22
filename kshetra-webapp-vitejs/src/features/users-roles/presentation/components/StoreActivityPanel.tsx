import { Icon } from '@/shared/ui'
import { ActivityPanelHeader } from '@/features/users-roles/presentation/components/ActivityPanelHeader'
import { StatTile } from '@/features/users-roles/presentation/components/StatTile'
import type { UserMetrics } from '@/features/users-roles/domain/entities/user'

export interface StoreActivityPanelProps {
  metrics: UserMetrics
}

/** Store staff detail panel: orders fulfilled, refunds, stock adjustments — this month. */
export function StoreActivityPanel({ metrics }: StoreActivityPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm">
      <ActivityPanelHeader
        icon={<Icon name="shopping-bag" size={18} />}
        title="Store activity"
        trailing={<span className="rounded-full bg-sunken px-2.5 py-1 text-xs text-ink-subtle">This month</span>}
      />
      <div className="flex flex-wrap gap-2.5">
        <StatTile value={String(metrics.ordersFulfilled ?? 0)} label="Orders fulfilled" />
        <StatTile value={String(metrics.refundsRecorded ?? 0)} label="Refunds recorded" />
        <StatTile value={String(metrics.stockAdjustments ?? 0)} label="Stock adjustments" />
      </div>
    </div>
  )
}
