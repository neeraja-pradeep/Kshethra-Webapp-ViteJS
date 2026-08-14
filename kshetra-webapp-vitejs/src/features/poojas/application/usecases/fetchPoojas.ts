import type { Result } from '@/core/error/result'

import type {
  PoojaFilters,
  PoojaPage,
} from '@/features/poojas/domain/repositories/pooja.repository'
import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function fetchPoojas(filters?: PoojaFilters): Promise<Result<PoojaPage>> {
  return poojaRepository.fetchPoojas(filters)
}
