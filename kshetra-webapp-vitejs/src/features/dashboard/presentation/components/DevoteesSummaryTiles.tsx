import type { DevoteesSnapshot } from '@/features/dashboard/domain/entities/dashboard-snapshot'

import { DashboardStat } from './DashboardStat'

export interface DevoteesSummaryTilesProps {
  summary: DevoteesSnapshot
  /** Click-through to the Devotees screen, pre-filtered to the tile's status. */
  onSelect: (status: 'active' | 'suspended' | null) => void
}

/**
 * The same three tiles the App > Devotees screen puts above its table, served
 * by the same code server-side — the card is a way *in* to that screen, and a
 * landing page whose total disagrees with the screen it links to is worse than
 * no card at all.
 */
export function DevoteesSummaryTiles({ summary, onSelect }: DevoteesSummaryTilesProps) {
  const tiles = [
    { key: 'total', value: summary.total, label: 'Total devotees', status: null },
    { key: 'active', value: summary.active, label: 'Active', status: 'active' },
    { key: 'suspended', value: summary.suspended, label: 'Suspended', status: 'suspended' },
  ] as const

  return (
    <div className="flex gap-6.5">
      {tiles.map((tile) => (
        <button
          key={tile.key}
          type="button"
          onClick={() => onSelect(tile.status)}
          className="rounded-md border-none bg-transparent p-0 text-left font-sans transition-shadow duration-140 ease-ks hover:shadow-card-hover"
        >
          <DashboardStat stat={{ value: String(tile.value), label: tile.label }} />
        </button>
      ))}
    </div>
  )
}
