import { http } from '@/core/api/http'
import { MULTIPART_REQUEST, toFormData, type MultipartValue } from '@/core/api/multipart'
import { POOJA_ADMIN_ENDPOINTS } from '@/core/config/endpoints'

import { godIsActive, type GodStatus } from '@/features/poojas/domain/entities/god'
import type { GodFilters, GodWrite } from '@/features/poojas/domain/repositories/god.repository'
import {
  godListResponseSchema,
  godWriteResponseSchema,
  reorderGodsResponseSchema,
  type GodResponseDto,
} from '@/features/poojas/infrastructure/data-sources/remote/god.response'

/** Only keys the caller actually set are sent — an empty one means "no filter". */
function toParams(filters: GodFilters): Record<string, string> {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.isActive !== undefined ? { is_active: String(filters.isActive) } : {}),
  }
}

/** Only keys the caller actually set are sent, so a patch changes nothing else. */
function toBody(input: Partial<GodWrite>): Record<string, MultipartValue> {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.status !== undefined ? { is_active: godIsActive(input.status) } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.media !== undefined ? { media: input.media } : {}),
    ...(input.homeMedia !== undefined ? { home_media: input.homeMedia } : {}),
  }
}

/**
 * Multipart only when there is a file to send.
 *
 * A multipart part cannot carry a null, so clearing a picture (`media: null`)
 * has to go as JSON — which this endpoint accepts for everything except the
 * upload itself.
 *
 * A god has two pictures, so "upload one and clear the other" is reachable and
 * cannot be one request: the cleared field would arrive as the empty string.
 * That case sends the clear as JSON first, then the upload, so neither half is
 * expressed in a format that cannot carry it.
 */
async function send(method: 'post' | 'patch', url: string, input: Partial<GodWrite>) {
  const uploading: Record<string, MultipartValue> = {}
  if (input.media instanceof File) uploading.media = input.media
  if (input.homeMedia instanceof File) uploading.home_media = input.homeMedia
  const isClearing = input.media === null || input.homeMedia === null

  if (!Object.keys(uploading).length) return http[method](url, toBody(input))
  if (!isClearing) return http[method](url, toFormData(toBody(input)), MULTIPART_REQUEST)

  // Clear as JSON first — keeping every scalar, so a create still carries its
  // own fields — then send the file(s) on their own.
  const withoutUploads: Record<string, unknown> = { ...input }
  if (input.media instanceof File) delete withoutUploads.media
  if (input.homeMedia instanceof File) delete withoutUploads.homeMedia
  const cleared = await http[method](url, toBody(withoutUploads as Partial<GodWrite>))

  const parsed = godWriteResponseSchema.parse(cleared.data)
  return http.patch(POOJA_ADMIN_ENDPOINTS.god(parsed.id), toFormData(uploading), MULTIPART_REQUEST)
}

/**
 * The whole list. No `page`/`page_size`: paging here is opt-in, and reordering
 * needs every god in one response.
 */
export async function getGods(filters: GodFilters = {}) {
  const response = await http.get(POOJA_ADMIN_ENDPOINTS.gods, { params: toParams(filters) })
  return godListResponseSchema.parse(response.data)
}

export async function postGod(input: GodWrite): Promise<GodResponseDto> {
  const response = await send('post', POOJA_ADMIN_ENDPOINTS.gods, input)
  return godWriteResponseSchema.parse(response.data)
}

export async function patchGod(id: number, input: Partial<GodWrite>): Promise<GodResponseDto> {
  const response = await send('patch', POOJA_ADMIN_ENDPOINTS.god(id), input)
  return godWriteResponseSchema.parse(response.data)
}

/** The status toggle writes one field — never a stale copy of the rest of the form. */
export async function patchGodStatus(id: number, status: GodStatus): Promise<GodResponseDto> {
  const response = await http.patch(POOJA_ADMIN_ENDPOINTS.god(id), {
    is_active: godIsActive(status),
  })
  return godWriteResponseSchema.parse(response.data)
}

export async function deleteGodRequest(id: number): Promise<void> {
  await http.delete(POOJA_ADMIN_ENDPOINTS.god(id))
}

export async function postReorderGods(
  order: readonly number[],
): Promise<readonly GodResponseDto[]> {
  const response = await http.post(POOJA_ADMIN_ENDPOINTS.reorderGods, { order })
  return reorderGodsResponseSchema.parse(response.data)
}
