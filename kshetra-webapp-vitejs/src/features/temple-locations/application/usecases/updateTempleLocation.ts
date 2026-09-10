import type { Result } from '@/core/error/result'
import type {
  TempleLocation,
  TempleLocationWrite,
} from '@/features/temple-locations/domain/entities/temple-location'
import { templeLocationRepository } from '@/features/temple-locations/infrastructure/repositories/temple-location.repository.impl'

export function updateTempleLocation(
  id: number,
  input: TempleLocationWrite,
): Promise<Result<TempleLocation>> {
  return templeLocationRepository.updateTempleLocation(id, input)
}
