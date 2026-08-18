import type { Result } from '@/core/error/result'
import type { DevoteeDetail } from '@/features/devotees/domain/entities/devotee'
import { devoteeRepository } from '@/features/devotees/infrastructure/repositories/devotee.repository.impl'

export function fetchDevotee(id: number): Promise<Result<DevoteeDetail>> {
  return devoteeRepository.fetchDevotee(id)
}
