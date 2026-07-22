import { KpiTile } from '@/shared/ui'
import type { KpiItem } from '@/features/users-roles/presentation/utils/kpi'

export interface KpiBandProps {
  items: readonly KpiItem[]
}

/** Row of small stat tiles: total users, then one per status present in view. */
export function KpiBand({ items }: KpiBandProps) {
  return (
    <div className="flex flex-wrap gap-2.5 px-7 pb-3.5">
      {items.map((item) => (
        <KpiTile key={item.key} value={item.value} label={item.label} dot={item.dot} />
      ))}
    </div>
  )
}
