import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { godKeys } from '@/features/poojas/application/queries/god.keys'
import { fetchGods } from '@/features/poojas/application/usecases/fetchGods'
import type { GodFilters } from '@/features/poojas/domain/repositories/god.repository'

/**
 * The god list, unpaged — the screen pages what it already holds so that the
 * drag handle always has the complete order to send.
 *
 * `keepPreviousData` stops the table blanking on every keystroke and filter
 * change: the previous list stays put, dimmed by the caller, until the new one
 * lands.
 */
export function useGodsQuery(filters: GodFilters) {
  return useQuery({
    queryKey: godKeys.list(filters),
    queryFn: async () => unwrap(await fetchGods(filters)),
    placeholderData: keepPreviousData,
  })
}
