import type { Result } from '@/core/error/result'
import type { TempleLocation } from '@/features/temple-locations/domain/entities/temple-location'
import { templeLocationRepository } from '@/features/temple-locations/infrastructure/repositories/temple-location.repository.impl'

export function fetchTempleLocation(id: number): Promise<Result<TempleLocation>> {
  return templeLocationRepository.fetchTempleLocation(id)
}
