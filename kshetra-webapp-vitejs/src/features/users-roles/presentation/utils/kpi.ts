import type { UserStatus } from '@/features/users-roles/domain/entities/user'

export interface KpiItem {
  readonly key: string
  readonly value: string
  readonly label: string
  /** Tailwind background class for the status dot, e.g. "bg-success". */
  readonly dot?: string
}

const STATUS_DOT: Record<UserStatus, string> = {
  Active: 'bg-success',
  Inactive: 'bg-ink-disabled',
}
const STATUS_RANK: Record<UserStatus, number> = { Active: 0, Inactive: 3 }

/**
 * Builds the KPI band: a leading "N users" total tile, followed by one tile
 * per status present in the current (filtered) rows, ordered active-first.
 */
export function buildStatusKpis(rows: readonly { readonly status: UserStatus }[], totalLabel: string): KpiItem[] {
  const counts = new Map<UserStatus, number>()
  for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1)
  const statuses = Array.from(counts.keys()).sort((a, b) => STATUS_RANK[a] - STATUS_RANK[b])

  return [
    { key: 'total', value: String(rows.length), label: totalLabel },
    ...statuses.map((status) => ({
      key: status,
      value: String(counts.get(status) ?? 0),
      label: status,
      dot: STATUS_DOT[status],
    })),
  ]
}
