import type { DevoteeOrdering } from '@/features/devotees/domain/repositories/devotee.repository'

/** What a clicked column header is called on this screen. */
export type DevoteeSortKey = 'name' | 'family' | 'bookings' | 'last' | 'status'
export type SortDirection = 'asc' | 'desc'

/**
 * Column header -> the server's `?ordering=` value. Only these five are
 * accepted; anything else is a 400, which is why the map is the only place a
 * sort value is spelled.
 */
export const ORDERING_PARAM: Record<DevoteeSortKey, DevoteeOrdering> = {
  name: 'name',
  family: 'family',
  bookings: 'bookings',
  last: 'last_activity',
  status: 'status',
}

/** The `?status=` values, plus the "All statuses" option, which sends nothing. */
export const ALL_STATUSES = 'all'
export type DevoteeStatusFilter = typeof ALL_STATUSES | 'active' | 'suspended'
