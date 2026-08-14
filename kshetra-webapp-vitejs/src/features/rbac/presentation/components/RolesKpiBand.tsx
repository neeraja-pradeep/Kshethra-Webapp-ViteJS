import { KpiTile } from '@/shared/ui'

/** One stat tile in the roles band. */
export interface RoleKpi {
  readonly key: string
  readonly value: string
  readonly label: string
}

/**
 * Row of stat tiles above the role catalogue.
 *
 * A local copy rather than a shared component: `counter-pos`, `orders` and
 * `agent-codes` each keep their own band too, and each drifts to fit its
 * screen. Promoting one is a separate cleanup, not a prerequisite here.
 */
export function RolesKpiBand({ items }: { items: readonly RoleKpi[] }) {
  return (
    <div className="flex flex-wrap gap-2.5 px-7 pb-3.5">
      {items.map((item) => (
        <KpiTile key={item.key} value={item.value} label={item.label} />
      ))}
    </div>
  )
}
