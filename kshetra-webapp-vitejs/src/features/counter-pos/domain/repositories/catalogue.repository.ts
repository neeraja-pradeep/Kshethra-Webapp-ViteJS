import type { Result } from '@/core/error/result'
import type { God } from '@/features/counter-pos/domain/entities/god'
import type { Nakshatra } from '@/features/counter-pos/domain/entities/nakshatra'
import type { Pooja } from '@/features/counter-pos/domain/entities/pooja'

/** The reference data a counter sale is assembled from. */
export interface CatalogueRepository {
  fetchPoojas(): Promise<Result<readonly Pooja[]>>
  fetchGods(): Promise<Result<readonly God[]>>
  fetchNakshatrams(): Promise<Result<readonly Nakshatra[]>>
}
