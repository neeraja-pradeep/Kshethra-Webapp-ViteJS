import { http } from '@/core/api/http'
import { TEMPLE_LOCATION_ENDPOINTS } from '@/core/config/endpoints'

import type { TempleLocationWrite } from '@/features/temple-locations/domain/entities/temple-location'
import type { TempleLocationFilters } from '@/features/temple-locations/domain/repositories/temple-location.repository'
import {
  templeLocationPageSchema,
  templeLocationResponseSchema,
  type TempleLocationPageDto,
  type TempleLocationResponseDto,
} from '@/features/temple-locations/infrastructure/data-sources/remote/templeLocation.response'

/** Only keys the caller actually set are sent — an empty one means "no filter". */
function toParams(filters: TempleLocationFilters): Record<string, string | number> {
  return {
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.pageSize ? { page_size: filters.pageSize } : {}),
  }
}

/**
 * Only keys the caller set are sent.
 *
 * That is what makes the edit form a true `PATCH`: touching the radius must not
 * re-send coordinates the user never opened, which would turn a typo elsewhere
 * on the form into a silent move of the shrine.
 */
function toWriteBody(input: TempleLocationWrite): Record<string, unknown> {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    ...(input.radiusMeters !== undefined ? { radius_meters: input.radiusMeters } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  }
}

export async function getTempleLocations(
  filters: TempleLocationFilters = {},
): Promise<TempleLocationPageDto> {
  const response = await http.get(TEMPLE_LOCATION_ENDPOINTS.locations, { params: toParams(filters) })
  return templeLocationPageSchema.parse(response.data)
}

export async function getTempleLocation(id: number): Promise<TempleLocationResponseDto> {
  const response = await http.get(TEMPLE_LOCATION_ENDPOINTS.location(id))
  return templeLocationResponseSchema.parse(response.data)
}

/** `POST` to the collection — there is no `new/` sub-path on this resource. */
export async function postTempleLocation(
  input: TempleLocationWrite,
): Promise<TempleLocationResponseDto> {
  const response = await http.post(TEMPLE_LOCATION_ENDPOINTS.locations, toWriteBody(input))
  return templeLocationResponseSchema.parse(response.data)
}

export async function patchTempleLocation(
  id: number,
  input: TempleLocationWrite,
): Promise<TempleLocationResponseDto> {
  const response = await http.patch(TEMPLE_LOCATION_ENDPOINTS.location(id), toWriteBody(input))
  return templeLocationResponseSchema.parse(response.data)
}

/** `204` with an empty body — nothing to parse. */
export async function deleteTempleLocation(id: number): Promise<void> {
  await http.delete(TEMPLE_LOCATION_ENDPOINTS.location(id))
}
