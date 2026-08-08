import { z } from 'zod'

import type { God } from '@/features/counter-pos/domain/entities/god'

/** Gods are pooja categories — `booking/poojacategory/`. */
export const godResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_active: z.boolean(),
  sort_order: z.number().nullable(),
})

export type GodResponseDto = z.infer<typeof godResponseSchema>

export function toGod(dto: GodResponseDto): God {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.is_active ? 'Active' : 'Inactive',
    sortOrder: dto.sort_order ?? 0,
  }
}
