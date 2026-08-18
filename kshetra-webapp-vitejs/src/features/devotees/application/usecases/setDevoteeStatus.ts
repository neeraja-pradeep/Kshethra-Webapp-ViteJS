import type { Result } from '@/core/error/result'
import type { Devotee, DevoteeStatus } from '@/features/devotees/domain/entities/devotee'
import { devoteeRepository } from '@/features/devotees/infrastructure/repositories/devotee.repository.impl'

export function setDevoteeStatus(id: number, status: DevoteeStatus): Promise<Result<Devotee>> {
  return devoteeRepository.setDevoteeStatus(id, status)
}
