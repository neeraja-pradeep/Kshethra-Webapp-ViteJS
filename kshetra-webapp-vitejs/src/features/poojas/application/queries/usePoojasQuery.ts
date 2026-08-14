import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { poojaKeys } from '@/features/poojas/application/queries/pooja.keys'
import { fetchAvailability } from '@/features/poojas/application/usecases/fetchAvailability'
import { fetchPooja } from '@/features/poojas/application/usecases/fetchPooja'
import { fetchPoojas } from '@/features/poojas/application/usecases/fetchPoojas'
import type { PoojaFilters } from '@/features/poojas/domain/repositories/pooja.repository'

/**
 * `keepPreviousData` stops the table blanking on every keystroke, page turn and
 * filter change: the previous page stays put, dimmed by the caller, until the
 * new one lands.
 */
export function usePoojasQuery(filters: PoojaFilters) {
  return useQuery({
    queryKey: poojaKeys.list(filters),
    queryFn: async () => unwrap(await fetchPoojas(filters)),
    placeholderData: keepPreviousData,
  })
}

export function usePoojaQuery(poojaId: number | null) {
  return useQuery({
    queryKey: poojaKeys.detail(poojaId ?? 0),
    queryFn: async () => unwrap(await fetchPooja(poojaId as number)),
    enabled: poojaId != null,
  })
}

/**
 * The booking calendar. Asks for `view_pooja`, unlike the blocks sub-resource,
 * whose `GET` is gated at `change_pooja` — so this is the one that is safe to
 * fire on a read-only view.
 */
export function usePoojaAvailabilityQuery(
  poojaId: number | null,
  start: string,
  end: string,
  enabled = true,
) {
  return useQuery({
    queryKey: poojaKeys.availability(poojaId ?? 0, start, end),
    queryFn: async () => unwrap(await fetchAvailability(poojaId as number, start, end)),
    enabled: enabled && poojaId != null,
  })
}
