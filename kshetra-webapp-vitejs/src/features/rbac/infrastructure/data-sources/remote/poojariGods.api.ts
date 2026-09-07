import { http } from '@/core/api/http'
import { countedList } from '@/core/api/wire'
import { ADMIN_BOOKING_ENDPOINTS, POOJA_ADMIN_ENDPOINTS } from '@/core/config/endpoints'

import {
  godOptionResponseSchema,
  poojariGodsResponseSchema,
  poojariGodsWriteResponseSchema,
  type GodOptionResponseDto,
  type PoojariGodsResponseDto,
  type PoojariGodsWriteResponseDto,
} from '@/features/rbac/infrastructure/data-sources/remote/poojariGod.response'

/** A poojari's current shrine list. 404 if the account is not a poojari. */
export async function getPoojariGods(id: number): Promise<PoojariGodsResponseDto> {
  const response = await http.get(ADMIN_BOOKING_ENDPOINTS.poojariGods(id))
  return poojariGodsResponseSchema.parse(response.data)
}

/**
 * Replaces the whole list — there is no per-row write, so the caller sends
 * every god that should remain. An unknown id is a 400 naming it.
 */
export async function putPoojariGods(id: number, godIds: readonly number[]): Promise<PoojariGodsWriteResponseDto> {
  const response = await http.put(ADMIN_BOOKING_ENDPOINTS.poojariGods(id), { god_ids: godIds })
  return poojariGodsWriteResponseSchema.parse(response.data)
}

/**
 * The gods the picker offers.
 *
 * `booking/poojacategory/` returns the whole set as `{ count, results }` with
 * no `next` — see `countedList` — so one call is the entire catalogue.
 */
export async function getGodOptions(): Promise<GodOptionResponseDto[]> {
  const response = await http.get(POOJA_ADMIN_ENDPOINTS.gods)
  return countedList(godOptionResponseSchema).parse(response.data).results
}
