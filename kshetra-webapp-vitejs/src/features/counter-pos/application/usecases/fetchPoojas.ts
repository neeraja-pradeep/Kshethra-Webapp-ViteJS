import type { Result } from '@/core/error/result'
import type { Pooja } from '@/features/counter-pos/domain/entities/pooja'
import { catalogueRepository } from '@/features/counter-pos/infrastructure/repositories/catalogue.repository.impl'

export function fetchPoojas(): Promise<Result<readonly Pooja[]>> {
  return catalogueRepository.fetchPoojas()
}
