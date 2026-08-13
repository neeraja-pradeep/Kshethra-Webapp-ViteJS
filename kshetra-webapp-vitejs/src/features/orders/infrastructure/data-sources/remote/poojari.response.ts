import { z } from 'zod'

import type { OrderPersonRef } from '@/features/orders/domain/entities/pooja-order-detail'

/**
 * Wire shape of `GET admin/poojaris/`.
 *
 * The `bookings` feature reads the same endpoint for its own dropdown, but
 * feature modules must not import each other, so each owns its mapping. The
 * shape is small and fixed by the server; the duplication is cheaper than the
 * coupling.
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
export function toOrderPoojari(dto: PoojariResponseDto): OrderPersonRef {
  const full = [dto.first_name, dto.last_name].filter(Boolean).join(' ').trim()
  return { id: dto.id, name: full || dto.username }
}
