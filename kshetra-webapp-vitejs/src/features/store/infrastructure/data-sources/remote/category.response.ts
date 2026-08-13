import { z } from 'zod'

import type { Category } from '@/features/store/domain/entities/category'

const text = z.string().nullish()

export const categoryStatusSchema = z.enum(['active', 'inactive'])

/**
 * Wire shape of `GET ecommerce/category/`.
 *
 * `children` is declared but not mapped: the API supports nesting and the admin
 * screen is flat, so reading it would only invite code that pretends otherwise.
 */
export const categoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent: z.number().nullish(),
  status: categoryStatusSchema,
  product_count: z.number().default(0),
  sort_order: z.number().default(0),
  sku_prefix: z.string().nullish(),
  sku_sequence: z.number().default(0),
  media_url: text,
  media_public_id: text,
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
})

/**
 * The list envelope.
 *
 * The doc's example shows `{count, results}`, but the running API also sends
 * `next`/`previous` — so both are optional and either shape parses.
 */
export const categoryListResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullish(),
  previous: z.string().nullish(),
  results: z.array(categoryResponseSchema),
})

/**
 * Reorder answers with the reordered list, but the doc does not pin whether it
 * is enveloped. Accept either and hand back a plain array.
 */
export const reorderResponseSchema = z.union([
  z.array(categoryResponseSchema),
  categoryListResponseSchema.transform((page) => page.results),
])

export type CategoryResponseDto = z.infer<typeof categoryResponseSchema>

export function toCategory(dto: CategoryResponseDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    parent: dto.parent ?? null,
    status: dto.status,
    productCount: dto.product_count,
    sortOrder: dto.sort_order,
    skuPrefix: dto.sku_prefix ?? '',
    skuSequence: dto.sku_sequence,
    mediaUrl: dto.media_url ?? null,
    mediaPublicId: dto.media_public_id ?? null,
    createdAt: dto.created_at ?? '',
    updatedAt: dto.updated_at ?? '',
  }
}
