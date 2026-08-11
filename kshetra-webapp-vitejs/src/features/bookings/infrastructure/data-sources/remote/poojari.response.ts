import { z } from 'zod'

import type { BookingPoojari } from '@/features/bookings/domain/entities/booking'

/**
 * Wire shape of `GET admin/poojaris/`. The assign endpoint accepts exactly this
 * set — an activated `temple_poojari` — so the dropdown and the server agree on
 * who may be handed work.
 */
export const poojariResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  is_activated: z.boolean(),
})

export type PoojariResponseDto = z.infer<typeof poojariResponseSchema>

/** Full name where there is one, else the username — never an empty label. */
export function toPoojari(dto: PoojariResponseDto): BookingPoojari {
  const full = [dto.first_name, dto.last_name].filter(Boolean).join(' ').trim()
  return { id: dto.id, name: full || dto.username }
}
