import type { Result } from '@/core/error/result'
import type { God } from '@/features/counter-pos/domain/entities/god'
import type { Nakshatra } from '@/features/counter-pos/domain/entities/nakshatra'
import type { Pooja } from '@/features/counter-pos/domain/entities/pooja'

/** The reference data a counter sale is assembled from. */
export interface CatalogueRepository {
  /**
   * Both filters are applied by the server. `search` matches the pooja's god
   * and a romanized spelling of a Malayalam name, neither of which the loaded
   * rows carry for a client-side match to find — and once `search` has narrowed
   * them, filtering those rows by god would search within the search.
   */
  fetchPoojas(search?: string, godId?: number): Promise<Result<readonly Pooja[]>>
  fetchGods(): Promise<Result<readonly God[]>>
  fetchNakshatrams(): Promise<Result<readonly Nakshatra[]>>
}
