import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import type { TempleLocationFilters } from '@/features/temple-locations/domain/repositories/temple-location.repository'
import { fetchTempleLocation } from '@/features/temple-locations/application/usecases/fetchTempleLocation'
import { fetchTempleLocations } from '@/features/temple-locations/application/usecases/fetchTempleLocations'
import { templeLocationKeys } from '@/features/temple-locations/application/queries/templeLocation.keys'

export function useTempleLocationsQuery(filters: TempleLocationFilters) {
  return useQuery({
    queryKey: templeLocationKeys.list(filters),
    queryFn: async () => unwrap(await fetchTempleLocations(filters)),
    placeholderData: keepPreviousData,
  })
}

export function useTempleLocationQuery(id: number | null) {
  return useQuery({
    queryKey: templeLocationKeys.detail(id ?? 0),
    queryFn: async () => unwrap(await fetchTempleLocation(id as number)),
    enabled: id !== null,
  })
}
