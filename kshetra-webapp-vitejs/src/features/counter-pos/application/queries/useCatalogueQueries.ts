import { useQuery } from '@tanstack/react-query'

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

/** Every active pooja, fetched once — the endpoint is unpaginated, so search filters locally. */
export function usePoojasQuery() {
  return useQuery({
    queryKey: counterKeys.poojas(),
    queryFn: async () => unwrap(await fetchPoojas()),
    staleTime: CATALOGUE_STALE_TIME_MS,
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
