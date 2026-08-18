import { http } from '@/core/api/http'
import { DEVOTEE_ENDPOINTS } from '@/core/config/endpoints'

import type { DevoteeStatus } from '@/features/devotees/domain/entities/devotee'
import type { DevoteeFilters } from '@/features/devotees/domain/repositories/devotee.repository'
import {
  devoteeDetailResponseSchema,
  devoteePageResponseSchema,
  devoteeResponseSchema,
  type DevoteeDetailResponseDto,
  type DevoteePageResponseDto,
  type DevoteeResponseDto,
} from '@/features/devotees/infrastructure/data-sources/remote/devotee.response'

/** Only keys the caller actually set are sent — an empty one means "no filter". */
function toParams(filters: DevoteeFilters): Record<string, string | number> {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.ordering ? { ordering: filters.ordering } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.pageSize ? { page_size: filters.pageSize } : {}),
  }
}

export async function getDevotees(filters: DevoteeFilters = {}): Promise<DevoteePageResponseDto> {
  const response = await http.get(DEVOTEE_ENDPOINTS.devotees, { params: toParams(filters) })
  return devoteePageResponseSchema.parse(response.data)
}

export async function getDevotee(id: number): Promise<DevoteeDetailResponseDto> {
  const response = await http.get(DEVOTEE_ENDPOINTS.devotee(id))
  return devoteeDetailResponseSchema.parse(response.data)
}

/** Returns the updated row in the shape the table renders, not a detail. */
export async function patchDevoteeStatus(id: number, status: DevoteeStatus): Promise<DevoteeResponseDto> {
  const response = await http.patch(DEVOTEE_ENDPOINTS.devoteeStatus(id), { status })
  return devoteeResponseSchema.parse(response.data)
}
