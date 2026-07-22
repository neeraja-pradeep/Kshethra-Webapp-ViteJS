import type { Devotee, DevoteeStatus } from '@/features/devotees/domain/entities/devotee'

export interface KpiItem {
  readonly id: string
  readonly value: string
  readonly label: string
  /** Tailwind background class for the status dot; absent for the "total" tile. */
  readonly dotClassName?: string
}

const DOT_CLASSNAME: Record<DevoteeStatus, string> = {
  Active: 'bg-success',
  Suspended: 'bg-danger',
}

const STATUS_RANK: Record<DevoteeStatus, number> = { Active: 0, Suspended: 3 }

/**
 * "N devotees" total tile followed by one tile per status present in `rows`,
 * ordered active-first. Mirrors the DC prototype's bandKpis().
 */
export function computeDevoteeKpis(rows: readonly Devotee[]): KpiItem[] {
  const seen = new Map<DevoteeStatus, number>()
  for (const row of rows) {
    seen.set(row.status, (seen.get(row.status) ?? 0) + 1)
  }
  const statuses = [...seen.keys()].sort((a, b) => STATUS_RANK[a] - STATUS_RANK[b])

  return [
    { id: 'total', value: String(rows.length), label: 'devotees' },
    ...statuses.map((status) => ({
      id: status,
      value: String(seen.get(status)),
      label: status,
      dotClassName: DOT_CLASSNAME[status],
    })),
  ]
}
