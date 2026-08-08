import { z } from 'zod'

import type { CollectionSummary } from '@/features/counter-pos/domain/entities/collection-summary'
import { decimal } from '@/features/counter-pos/infrastructure/data-sources/remote/wire'

export const collectionSummaryResponseSchema = z.object({
  date: z.string(),
  total_amount: decimal,
  pooja_count: z.number(),
  transaction_count: z.number(),
  by_method: z.array(
    z.object({
      method: z.enum(['cash', 'card', 'upi', 'netbanking']),
      amount: decimal,
    }),
  ),
})

export type CollectionSummaryResponseDto = z.infer<typeof collectionSummaryResponseSchema>

export function toCollectionSummary(dto: CollectionSummaryResponseDto): CollectionSummary {
  return {
    date: dto.date,
    totalAmount: dto.total_amount,
    poojaCount: dto.pooja_count,
    transactionCount: dto.transaction_count,
    byMethod: dto.by_method.map((entry) => ({ method: entry.method, amount: entry.amount })),
  }
}
