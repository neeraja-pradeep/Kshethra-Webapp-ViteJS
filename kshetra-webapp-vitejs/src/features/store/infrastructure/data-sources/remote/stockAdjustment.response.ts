import { z } from 'zod'

import type { StockAdjustmentEntry } from '@/features/store/domain/entities/stock-adjustment'

/** Wire shape of one `StockAdjustment`, as `GET …/stock/` serves it. */
export const stockAdjustmentSchema = z.object({
  id: z.number(),
  delta: z.number(),
  quantity_before: z.number(),
  quantity_after: z.number(),
  reason: z.string().nullish(),
  adjusted_by: z.string().nullish(),
  created_at: z.string(),
})

/**
 * The running API answers with a bare array. The doc pins the entry's fields
 * but not its envelope, so a paged shape is accepted too rather than making
 * that a contract break.
 */
export const stockHistoryResponseSchema = z.union([
  z.array(stockAdjustmentSchema),
  z.object({ results: z.array(stockAdjustmentSchema) }).transform((page) => page.results),
])

export type StockAdjustmentDto = z.infer<typeof stockAdjustmentSchema>

export function toStockAdjustmentEntry(dto: StockAdjustmentDto): StockAdjustmentEntry {
  return {
    id: dto.id,
    delta: dto.delta,
    quantityBefore: dto.quantity_before,
    quantityAfter: dto.quantity_after,
    reason: dto.reason ?? '',
    adjustedBy: dto.adjusted_by ?? '',
    createdAt: dto.created_at,
  }
}
