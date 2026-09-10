import { z } from 'zod'

import { paginated } from '@/core/api/wire'

import type { TempleLocation } from '@/features/temple-locations/domain/entities/temple-location'

/**
 * Wire shapes for `admin/temple-locations/`.
 *
 * One schema serves every response: the list's `results[]`, the create, the
 * read and both updates all answer with the same flat object. Only the list
 * wraps it in a DRF page.
 */
export const templeLocationResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  /**
   * Deliberately **not** `decimal` from `@/core/api/wire`, which coerces to a
   * number. These are 6-place decimals the server compares distances against,
   * and a float round-trip would drift the last place. They stay strings from
   * the wire to the input box.
   */
  latitude: z.string(),
  longitude: z.string(),
  radius_meters: z.number(),
  is_active: z.boolean(),
})

/** The list — a standard DRF page, the only paginated endpoint here. */
export const templeLocationPageSchema = paginated(templeLocationResponseSchema)

export type TempleLocationResponseDto = z.infer<typeof templeLocationResponseSchema>
export type TempleLocationPageDto = z.infer<typeof templeLocationPageSchema>

export function toTempleLocation(dto: TempleLocationResponseDto): TempleLocation {
  return {
    id: dto.id,
    name: dto.name,
    latitude: dto.latitude,
    longitude: dto.longitude,
    radiusMeters: dto.radius_meters,
    isActive: dto.is_active,
  }
}
