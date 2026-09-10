import type { Result } from '@/core/error/result'
import type {
  TempleLocation,
  TempleLocationPage,
  TempleLocationWrite,
} from '@/features/temple-locations/domain/entities/temple-location'

/**
 * The list takes paging and nothing else — there is no search, ordering or
 * status filter server-side. A temple has a handful of sites, so the screen
 * asks for one large page rather than inventing client-side filtering that
 * would silently narrow a page instead of the set.
 */
export interface TempleLocationFilters {
  readonly page?: number
  /** Max 100 server-side. */
  readonly pageSize?: number
}

export interface TempleLocationRepository {
  fetchTempleLocations(filters?: TempleLocationFilters): Promise<Result<TempleLocationPage>>
  fetchTempleLocation(id: number): Promise<Result<TempleLocation>>
  createTempleLocation(input: TempleLocationWrite): Promise<Result<TempleLocation>>
  /** Partial — an absent key is left alone. */
  updateTempleLocation(id: number, input: TempleLocationWrite): Promise<Result<TempleLocation>>
  /**
   * Permanent. Prefer `updateTempleLocation(id, { isActive: false })`: deleting
   * clears every poojari's assignment to this site (`SET NULL`), and if it was
   * the last active one, every mark starts failing.
   */
  deleteTempleLocation(id: number): Promise<Result<void>>
}
