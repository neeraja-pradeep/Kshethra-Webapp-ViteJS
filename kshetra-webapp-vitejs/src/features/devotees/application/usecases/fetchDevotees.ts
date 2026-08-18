import type { Result } from '@/core/error/result'
import type { DevoteeFilters, DevoteePage } from '@/features/devotees/domain/repositories/devotee.repository'
import { devoteeRepository } from '@/features/devotees/infrastructure/repositories/devotee.repository.impl'

export function fetchDevotees(filters?: DevoteeFilters): Promise<Result<DevoteePage>> {
  return devoteeRepository.fetchDevotees(filters)
}
