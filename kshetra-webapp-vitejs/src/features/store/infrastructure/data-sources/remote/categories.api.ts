import { http } from '@/core/api/http'
import { MULTIPART_REQUEST, toFormData } from '@/core/api/multipart'
import { STORE_ENDPOINTS } from '@/core/config/endpoints'

import type { CategoryStatus } from '@/features/store/domain/entities/category'
import type { CategoryWrite } from '@/features/store/domain/repositories/category.repository'
import {
  categoryListResponseSchema,
  categoryResponseSchema,
  reorderResponseSchema,
  type CategoryResponseDto,
} from '@/features/store/infrastructure/data-sources/remote/category.response'

/**
 * The screen needs the whole list to drag against, and reordering takes every
 * id at once — so ask for the server's maximum rather than page through it.
 */
const CATEGORY_PAGE_SIZE = 500

/** Only keys the caller actually set are sent, so a patch changes nothing else. */
function toBody(input: Partial<CategoryWrite>): Record<string, string | number | null | File | undefined> {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.skuPrefix !== undefined ? { sku_prefix: input.skuPrefix } : {}),
    ...(input.media !== undefined ? { media: input.media } : {}),
  }
}

/**
 * Multipart only when there is a file to send.
 *
 * A multipart part cannot carry a null, so clearing the picture (`media: null`)
 * has to go as JSON — which the endpoint accepts for everything except the
 * upload itself.
 */
function send(method: 'post' | 'patch', url: string, input: Partial<CategoryWrite>) {
  const body = toBody(input)
  return input.media instanceof File
    ? http[method](url, toFormData(body), MULTIPART_REQUEST)
    : http[method](url, body)
}

export async function getCategories(): Promise<readonly CategoryResponseDto[]> {
  const response = await http.get(STORE_ENDPOINTS.categories, { params: { page_size: CATEGORY_PAGE_SIZE } })
  return categoryListResponseSchema.parse(response.data).results
}

export async function postCategory(input: CategoryWrite): Promise<CategoryResponseDto> {
  const response = await send('post', STORE_ENDPOINTS.categories, input)
  return categoryResponseSchema.parse(response.data)
}

export async function patchCategory(id: number, input: Partial<CategoryWrite>): Promise<CategoryResponseDto> {
  const response = await send('patch', STORE_ENDPOINTS.category(id), input)
  return categoryResponseSchema.parse(response.data)
}

/** The status toggle writes one field — never a stale copy of the rest of the form. */
export async function patchCategoryStatus(id: number, status: CategoryStatus): Promise<CategoryResponseDto> {
  const response = await http.patch(STORE_ENDPOINTS.category(id), { status })
  return categoryResponseSchema.parse(response.data)
}

export async function deleteCategoryRequest(id: number): Promise<void> {
  await http.delete(STORE_ENDPOINTS.category(id))
}

export async function postReorderCategories(order: readonly number[]): Promise<readonly CategoryResponseDto[]> {
  const response = await http.post(STORE_ENDPOINTS.reorderCategories, { order })
  return reorderResponseSchema.parse(response.data)
}
