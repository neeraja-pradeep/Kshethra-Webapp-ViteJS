import type { Result } from '@/core/error/result'
import type { CollectionSummary } from '@/features/counter-pos/domain/entities/collection-summary'
import { counterRepository } from '@/features/counter-pos/infrastructure/repositories/counter.repository.impl'

export function fetchCollectionSummary(date: string): Promise<Result<CollectionSummary>> {
  return counterRepository.fetchCollectionSummary(date)
}
