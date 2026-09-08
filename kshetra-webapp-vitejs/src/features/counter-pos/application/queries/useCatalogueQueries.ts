import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { counterKeys } from '@/features/counter-pos/application/queries/counter-pos.keys'
import { fetchGods } from '@/features/counter-pos/application/usecases/fetchGods'
import { fetchNakshatrams } from '@/features/counter-pos/application/usecases/fetchNakshatrams'
import { fetchPoojas } from '@/features/counter-pos/application/usecases/fetchPoojas'

/**
 * Catalogue data barely changes during a shift, and the server caches these
 * responses anyway — hold them long enough that browsing poojas never waits.
 *
 * The flip side: an admin's price edit may not appear until this expires,
 * because the server's own cache has no expiry either.
 */
const CATALOGUE_STALE_TIME_MS = 5 * 60 * 1000

/**
 * The active poojas, narrowed by the server when the operator types.
 *
 * Searching server-side rather than filtering the loaded rows is what lets
 * "haridra homam" find ഹരിദ്ര ഹോമം and "ganapathi" find every pooja at that
 * god's shrine — neither is expressible as an `includes()` over a name.
 *
 * `keepPreviousData` is what keeps the till usable while typing: the previous
 * matches stay on screen instead of the list emptying between keystrokes, which
 * at a counter with somebody waiting reads as "no such pooja".
 *
 * `godId` is the browse chip, also applied server-side: the loaded rows are
 * already narrowed by `search`, so filtering them again would search within the
 * search rather than the catalogue.
 *
 * Pass a **debounced** term — this fires one request per distinct value.
 */
export function usePoojasQuery(search?: string, godId: number | null = null) {
  return useQuery({
    queryKey: counterKeys.poojas(search, godId),
    queryFn: async () => unwrap(await fetchPoojas(search, godId ?? undefined)),
    staleTime: CATALOGUE_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })
}

export function useGodsQuery() {
  return useQuery({
    queryKey: counterKeys.gods(),
    queryFn: async () => unwrap(await fetchGods()),
    staleTime: CATALOGUE_STALE_TIME_MS,
  })
}

export function useNakshatramsQuery() {
  return useQuery({
    queryKey: counterKeys.nakshatrams(),
    queryFn: async () => unwrap(await fetchNakshatrams()),
    staleTime: CATALOGUE_STALE_TIME_MS,
  })
}
