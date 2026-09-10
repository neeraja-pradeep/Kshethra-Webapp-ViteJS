import type { Result } from '@/core/error/result'
import { templeLocationRepository } from '@/features/temple-locations/infrastructure/repositories/temple-location.repository.impl'

export function deleteTempleLocation(id: number): Promise<Result<void>> {
  return templeLocationRepository.deleteTempleLocation(id)
}
