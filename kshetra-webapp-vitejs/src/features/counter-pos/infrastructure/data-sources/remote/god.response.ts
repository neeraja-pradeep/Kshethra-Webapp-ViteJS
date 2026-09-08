import { z } from 'zod'

import type { God } from '@/features/counter-pos/domain/entities/god'

/** Gods are pooja categories — `booking/poojacategory/`. */
export const godResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_active: z.boolean(),
  sort_order: z.number().nullable(),
  /** Absent on older builds — treated as "unknown", so the god is kept. */
  poojas_count: z.number().nullish(),
})

export type GodResponseDto = z.infer<typeof godResponseSchema>

export function toGod(dto: GodResponseDto): God {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.is_active ? 'Active' : 'Inactive',
    sortOrder: dto.sort_order ?? 0,
    // A missing count must not hide a god that may well have poojas.
    poojasCount: dto.poojas_count ?? 1,
  }
}
