import type { Devotee, DevoteeStatus } from '@/features/devotees/domain/entities/devotee'

export type DevoteeStatusFilter = 'all' | DevoteeStatus
export type DevoteeSortKey = 'name' | 'family' | 'bookings' | 'last' | 'status'
export type SortDirection = 'asc' | 'desc'

/** Matches search text against name, phone, email, and family member fields. */
export function filterDevotees(rows: readonly Devotee[], search: string, statusFilter: DevoteeStatusFilter): Devotee[] {
  const q = search.trim().toLowerCase()
  const filtered = rows.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (!q) return true
    const haystack = [d.name, d.phone, d.email, ...d.family.map((m) => `${m.name} ${m.nakshatra}`)].join(' ').toLowerCase()
    return haystack.includes(q)
  })
  // Baseline order: most recently active first, then name.
  return filtered.sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : a.lastActivity > b.lastActivity ? -1 : a.name.localeCompare(b.name)))
}

function sortValue(row: Devotee, key: DevoteeSortKey): string | number {
  if (key === 'family') return row.family.length
  if (key === 'bookings') return row.bookings.length
  if (key === 'last') return row.lastActivity
  return row[key]
}

/** Re-orders by a clicked column header; ties keep the incoming order. */
export function sortDevotees(rows: readonly Devotee[], key: DevoteeSortKey | '', direction: SortDirection): Devotee[] {
  if (!key) return [...rows]
  const sign = direction === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const x = sortValue(a, key)
    const y = sortValue(b, key)
    if (typeof x === 'number' && typeof y === 'number') return sign * (x - y)
    return sign * String(x).localeCompare(String(y), undefined, { numeric: true })
  })
}
