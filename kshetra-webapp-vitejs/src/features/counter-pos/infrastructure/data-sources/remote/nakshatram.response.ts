import { z } from 'zod'

import type { Nakshatra } from '@/features/counter-pos/domain/entities/nakshatra'

export const nakshatramResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export type NakshatramResponseDto = z.infer<typeof nakshatramResponseSchema>

export function toNakshatra(dto: NakshatramResponseDto): Nakshatra {
  return { id: dto.id, name: dto.name }
}
