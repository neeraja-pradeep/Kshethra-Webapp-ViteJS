import { z } from 'zod'

import { decimal } from '@/core/api/wire'
import type {
  ProductDetail,
  ProductRow,
  ProductsSummary,
} from '@/features/store/domain/entities/product'

const text = z.string().nullish()

export const stockStateSchema = z.enum(['in_stock', 'low_stock', 'out_of_stock'])
export const productStatusSchema = z.enum(['active', 'inactive', 'discontinued'])

/**
 * Wire shape of one row from `GET admin/store/products/`.
 *
 * A product with no variant yet still appears, with `sku`, `price` and
 * `variant_id` all null and `variant_count: 0` — which is what the new-product
 * form shows before anything is saved against it.
 */
export const productRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().nullish(),
  sku: text,
  category: z.object({ id: z.number(), name: z.string() }).nullish(),
  price: decimal.nullish(),
  image_url: text,
  stock_quantity: z.number().default(0),
  stock_state: stockStateSchema,
  low_stock_threshold: z.number().default(10),
  status: productStatusSchema,
  status_display: text,
  variant_id: z.number().nullish(),
  variant_count: z.number().default(0),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
})

/** The form's extra fields, served only on a single-product read or write. */
export const productDetailSchema = productRowSchema.extend({
  description: z.string().nullish(),
  images: z
    .array(z.object({ id: z.number(), url: z.string(), sort_order: z.number().default(0) }))
    .default([]),
})

/**
 * All three stock states are documented as always present, so an enum key is
 * right here and zod v4 makes it exhaustive — the opposite call from the order
 * feed's `by_payment_status`, where the server omits empty statuses and a loose
 * string key is required.
 */
export const productsSummarySchema = z.object({
  total: z.number(),
  by_stock_state: z.record(stockStateSchema, z.number()),
})

export const productPageResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullish(),
  previous: z.string().nullish(),
  results: z.array(productRowSchema),
  summary: productsSummarySchema,
})

export type ProductRowDto = z.infer<typeof productRowSchema>
export type ProductDetailDto = z.infer<typeof productDetailSchema>
export type ProductsSummaryDto = z.infer<typeof productsSummarySchema>

export function toProductRow(dto: ProductRowDto): ProductRow {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug ?? '',
    sku: dto.sku ?? null,
    category: dto.category ?? null,
    price: dto.price ?? null,
    imageUrl: dto.image_url ?? null,
    stockQuantity: dto.stock_quantity,
    stockState: dto.stock_state,
    lowStockThreshold: dto.low_stock_threshold,
    status: dto.status,
    statusDisplay: dto.status_display ?? '',
    variantId: dto.variant_id ?? null,
    variantCount: dto.variant_count,
    createdAt: dto.created_at ?? '',
    updatedAt: dto.updated_at ?? '',
  }
}

export function toProductDetail(dto: ProductDetailDto): ProductDetail {
  return {
    ...toProductRow(dto),
    description: dto.description ?? '',
    images: dto.images.map((image) => ({ id: image.id, url: image.url, sortOrder: image.sort_order })),
  }
}

export function toProductsSummary(dto: ProductsSummaryDto): ProductsSummary {
  const counts = dto.by_stock_state
  return {
    total: dto.total,
    // Read through the states we expect rather than the keys we got, so a tile
    // reads zero instead of vanishing if the server ever omits one.
    byStockState: {
      in_stock: counts.in_stock ?? 0,
      low_stock: counts.low_stock ?? 0,
      out_of_stock: counts.out_of_stock ?? 0,
    },
  }
}
