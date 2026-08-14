import type { Result } from '@/core/error/result'

import type { GodFilters, GodPage } from '@/features/poojas/domain/repositories/god.repository'
import { godRepository } from '@/features/poojas/infrastructure/repositories/god.repository.impl'

export function fetchGods(filters?: GodFilters): Promise<Result<GodPage>> {
  return godRepository.fetchGods(filters)
}
