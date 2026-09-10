import type { Result } from '@/core/error/result'
import type { TempleLocationPage } from '@/features/temple-locations/domain/entities/temple-location'
import type { TempleLocationFilters } from '@/features/temple-locations/domain/repositories/temple-location.repository'
import { templeLocationRepository } from '@/features/temple-locations/infrastructure/repositories/temple-location.repository.impl'

export function fetchTempleLocations(
  filters?: TempleLocationFilters,
): Promise<Result<TempleLocationPage>> {
  return templeLocationRepository.fetchTempleLocations(filters)
}
