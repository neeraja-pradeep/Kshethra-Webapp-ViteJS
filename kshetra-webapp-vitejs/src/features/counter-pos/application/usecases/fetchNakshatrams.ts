import type { Result } from '@/core/error/result'
import type { Nakshatra } from '@/features/counter-pos/domain/entities/nakshatra'
import { catalogueRepository } from '@/features/counter-pos/infrastructure/repositories/catalogue.repository.impl'

export function fetchNakshatrams(): Promise<Result<readonly Nakshatra[]>> {
  return catalogueRepository.fetchNakshatrams()
}
