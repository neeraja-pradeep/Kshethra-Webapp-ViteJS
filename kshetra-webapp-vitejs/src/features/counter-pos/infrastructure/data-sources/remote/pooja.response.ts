import { z } from 'zod'

import type { Pooja } from '@/features/counter-pos/domain/entities/pooja'
import type { SpecialPoojaDate } from '@/features/counter-pos/domain/entities/special-pooja-date'
import { decimal } from '@/features/counter-pos/infrastructure/data-sources/remote/wire'

/**
 * `booking/poojas/` already nests each special pooja's active, upcoming dates,
 * so the counter never needs `booking/special-pooja-dates/` — which is paged at
 * 10 and would also hand back dates in the past.
 */
const specialPoojaDateSchema = z.object({
  id: z.number(),
  date: z.string(),
  offline_price: decimal.nullable(),
})

export const poojaResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  god_ids: z.array(z.number()),
  offline_price: decimal,
  status: z.boolean(),
  special_pooja: z.boolean(),
  special_pooja_dates: z.array(specialPoojaDateSchema).default([]),
})

export type PoojaResponseDto = z.infer<typeof poojaResponseSchema>

function toSpecialPoojaDate(dto: z.infer<typeof specialPoojaDateSchema>): SpecialPoojaDate {
  return { id: dto.id, date: dto.date, offlinePrice: dto.offline_price }
}

export function toPooja(dto: PoojaResponseDto): Pooja {
  return {
    id: dto.id,
    name: dto.name,
    godIds: dto.god_ids,
    offlinePrice: dto.offline_price,
    status: dto.status ? 'Active' : 'Inactive',
    isSpecial: dto.special_pooja,
    specialDates: dto.special_pooja_dates.map(toSpecialPoojaDate),
  }
}
