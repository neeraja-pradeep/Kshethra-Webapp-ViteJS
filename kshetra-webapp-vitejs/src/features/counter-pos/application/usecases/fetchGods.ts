import type { Result } from '@/core/error/result'
import type { God } from '@/features/counter-pos/domain/entities/god'
import { catalogueRepository } from '@/features/counter-pos/infrastructure/repositories/catalogue.repository.impl'

export function fetchGods(): Promise<Result<readonly God[]>> {
  return catalogueRepository.fetchGods()
}
