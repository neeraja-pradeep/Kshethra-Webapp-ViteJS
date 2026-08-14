import { http } from '@/core/api/http'
import { MULTIPART_REQUEST, toFormData, type MultipartValue } from '@/core/api/multipart'
import { POOJA_ADMIN_ENDPOINTS } from '@/core/config/endpoints'

import { poojaIsActive, type PoojaStatus } from '@/features/poojas/domain/entities/pooja'
import type {
  PoojaBlockWrite,
  PoojaFilters,
  PoojaWrite,
} from '@/features/poojas/domain/repositories/pooja.repository'
import {
  availabilityResponseSchema,
  blockWriteResponseSchema,
  bulkDeleteResponseSchema,
  bulkStatusResponseSchema,
  importResponseSchema,
  poojaPageResponseSchema,
  poojaWriteResponseSchema,
  type PoojaResponseDto,
} from '@/features/poojas/infrastructure/data-sources/remote/pooja.response'

/** Only keys the caller actually set are sent — an empty one means "no filter". */
function toParams(filters: PoojaFilters): Record<string, string | number> {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status !== undefined ? { status: String(filters.status) } : {}),
    ...(filters.special !== undefined ? { special_pooja: String(filters.special) } : {}),
    ...(filters.hasIncentive !== undefined ? { has_incentive: String(filters.hasIncentive) } : {}),
    ...(filters.god ? { god: filters.god } : {}),
    ...(filters.ordering ? { ordering: filters.ordering } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.pageSize ? { page_size: filters.pageSize } : {}),
  }
}

/**
 * The scalar half of the form, as JSON.
 *
 * Prices go as fixed 2-decimal strings: the fields are `DecimalField`s, and
 * `1299.5` would arrive a rupee-and-a-half short of what was typed.
 */
function toScalarBody(input: Partial<PoojaWrite>): Record<string, unknown> {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.godIds !== undefined ? { god_ids: [...input.godIds] } : {}),
    ...(input.offlinePrice !== undefined ? { offline_price: input.offlinePrice.toFixed(2) } : {}),
    ...(input.onlinePrice !== undefined ? { online_price: input.onlinePrice.toFixed(2) } : {}),
    ...(input.poojariIncentive !== undefined
      ? { poojari_incentive: input.poojariIncentive.toFixed(2) }
      : {}),
    ...(input.status !== undefined ? { status: poojaIsActive(input.status) } : {}),
    ...(input.special !== undefined ? { special_pooja: input.special } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.bannerDesc !== undefined ? { banner_desc: input.bannerDesc } : {}),
    ...(input.cardDesc !== undefined ? { card_desc: input.cardDesc } : {}),
    ...(input.captionsDesc !== undefined ? { captions_desc: input.captionsDesc } : {}),
    ...(input.unavailableDates !== undefined
      ? {
          unavailable_dates: input.unavailableDates.map((block) => ({
            start_date: block.startDate,
            ...(block.endDate ? { end_date: block.endDate } : {}),
            ...(block.reason ? { reason: block.reason } : {}),
          })),
        }
      : {}),
    // Additive and never emptied, so an empty list is simply not sent.
    ...(input.specialPoojaDates?.length
      ? {
          special_pooja_dates: input.specialPoojaDates.map((date) => ({
            date: date.date,
            ...(date.time ? { time: date.time } : {}),
            ...(date.onlinePrice !== undefined
              ? { online_price: date.onlinePrice.toFixed(2) }
              : {}),
            ...(date.offlinePrice !== undefined
              ? { offline_price: date.offlinePrice.toFixed(2) }
              : {}),
            ...(date.banner !== undefined ? { banner: date.banner } : {}),
          })),
        }
      : {}),
  }
}

export function hasImageChange(input: Partial<PoojaWrite>): boolean {
  return input.media !== undefined || input.banner !== undefined
}

export async function getPoojas(filters: PoojaFilters = {}) {
  const response = await http.get(POOJA_ADMIN_ENDPOINTS.poojas, { params: toParams(filters) })
  return poojaPageResponseSchema.parse(response.data)
}

export async function getPooja(id: number): Promise<PoojaResponseDto> {
  const response = await http.get(POOJA_ADMIN_ENDPOINTS.pooja(id))
  return poojaWriteResponseSchema.parse(response.data)
}

/** Step one of a save: every scalar plus both nested cards, as one transaction. */
export async function postPooja(input: PoojaWrite): Promise<PoojaResponseDto> {
  const response = await http.post(POOJA_ADMIN_ENDPOINTS.poojas, toScalarBody(input))
  return poojaWriteResponseSchema.parse(response.data)
}

export async function patchPooja(
  id: number,
  input: Partial<PoojaWrite>,
): Promise<PoojaResponseDto> {
  const response = await http.patch(POOJA_ADMIN_ENDPOINTS.pooja(id), toScalarBody(input))
  return poojaWriteResponseSchema.parse(response.data)
}

/**
 * Step two: the artwork, on its own.
 *
 * Multipart only when there is a file — a multipart part cannot carry a null,
 * so clearing a picture has to take the JSON branch. A pooja has two pictures,
 * so "upload one and clear the other" is reachable and needs both branches:
 * the clear goes as JSON, the upload as multipart.
 */
export async function patchPoojaImages(
  id: number,
  input: Partial<PoojaWrite>,
): Promise<PoojaResponseDto> {
  const clearing: Record<string, MultipartValue> = {}
  const uploading: Record<string, MultipartValue> = {}
  if (input.media === null) clearing.media = null
  if (input.banner === null) clearing.banner = null
  if (input.media instanceof File) uploading.media = input.media
  if (input.banner instanceof File) uploading.banner = input.banner

  let data: unknown = null
  if (Object.keys(clearing).length) {
    data = (await http.patch(POOJA_ADMIN_ENDPOINTS.pooja(id), clearing)).data
  }
  if (Object.keys(uploading).length) {
    data = (
      await http.patch(POOJA_ADMIN_ENDPOINTS.pooja(id), toFormData(uploading), MULTIPART_REQUEST)
    ).data
  }
  if (data == null) return getPooja(id)
  return poojaWriteResponseSchema.parse(data)
}

/** The status toggle writes one field — never a stale copy of the rest of the form. */
export async function patchPoojaStatus(id: number, status: PoojaStatus): Promise<PoojaResponseDto> {
  const response = await http.patch(POOJA_ADMIN_ENDPOINTS.pooja(id), {
    status: poojaIsActive(status),
  })
  return poojaWriteResponseSchema.parse(response.data)
}

export async function deletePoojaRequest(id: number): Promise<void> {
  await http.delete(POOJA_ADMIN_ENDPOINTS.pooja(id))
}

export async function postDuplicatePooja(id: number, name?: string): Promise<PoojaResponseDto> {
  const response = await http.post(POOJA_ADMIN_ENDPOINTS.duplicatePooja(id), name ? { name } : {})
  return poojaWriteResponseSchema.parse(response.data)
}

export async function postBulkPoojaStatus(ids: readonly number[], status: PoojaStatus) {
  const response = await http.post(POOJA_ADMIN_ENDPOINTS.bulkStatusPoojas, {
    ids: [...ids],
    status: poojaIsActive(status),
  })
  return bulkStatusResponseSchema.parse(response.data)
}

export async function postBulkDeletePoojas(ids: readonly number[]) {
  const response = await http.post(POOJA_ADMIN_ENDPOINTS.bulkDeletePoojas, { ids: [...ids] })
  return bulkDeleteResponseSchema.parse(response.data)
}

export async function getAvailability(id: number, start?: string, end?: string) {
  const response = await http.get(POOJA_ADMIN_ENDPOINTS.poojaAvailability(id), {
    params: { ...(start ? { start } : {}), ...(end ? { end } : {}) },
  })
  return availabilityResponseSchema.parse(response.data)
}

export async function postPoojaBlock(id: number, block: PoojaBlockWrite) {
  const response = await http.post(POOJA_ADMIN_ENDPOINTS.poojaBlocks(id), {
    start_date: block.startDate,
    ...(block.endDate ? { end_date: block.endDate } : {}),
    ...(block.reason ? { reason: block.reason } : {}),
  })
  return blockWriteResponseSchema.parse(response.data)
}

export async function deletePoojaBlock(id: number, blockId: number): Promise<void> {
  await http.delete(POOJA_ADMIN_ENDPOINTS.poojaBlock(id, blockId))
}

/** The importer takes one field, `file`, as multipart. */
export async function postPoojaImport(file: File) {
  const response = await http.post(
    POOJA_ADMIN_ENDPOINTS.importPoojas,
    toFormData({ file }),
    MULTIPART_REQUEST,
  )
  return importResponseSchema.parse(response.data)
}

/** `?sample=true` is *Load sample data*; without it, *Download template*. */
export async function getImportTemplate(sample: boolean): Promise<Blob> {
  const response = await http.get(POOJA_ADMIN_ENDPOINTS.importTemplate, {
    params: sample ? { sample: 'true' } : {},
    responseType: 'blob',
  })
  return response.data as Blob
}
