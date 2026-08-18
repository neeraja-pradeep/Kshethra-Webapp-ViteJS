import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { devoteeKeys } from '@/features/devotees/application/queries/devotee.keys'
import { fetchDevotee } from '@/features/devotees/application/usecases/fetchDevotee'
import { fetchDevotees } from '@/features/devotees/application/usecases/fetchDevotees'
import type { DevoteeFilters } from '@/features/devotees/domain/repositories/devotee.repository'

/**
 * One page of the table, and the tiles above it.
 *
 * `keepPreviousData` is what stops the table blanking on every keystroke, page
 * turn and filter change: the previous page stays on screen, dimmed by the
 * caller, until the new one lands.
 */
export function useDevoteesQuery(filters: DevoteeFilters) {
  return useQuery({
    queryKey: devoteeKeys.list(filters),
    queryFn: async () => unwrap(await fetchDevotees(filters)),
    placeholderData: keepPreviousData,
  })
}

/**
 * The drill-down behind one row. Only fetched while the overlay is open — the
 * family and the two histories are a second call the table never needs.
 */
export function useDevoteeQuery(id: number | null) {
  return useQuery({
    queryKey: devoteeKeys.detail(id ?? 0),
    queryFn: async () => unwrap(await fetchDevotee(id as number)),
    enabled: id !== null,
  })
}
