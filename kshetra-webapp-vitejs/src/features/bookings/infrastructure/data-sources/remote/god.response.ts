import { z } from 'zod'

/**
 * `booking/poojacategory/` — gods, for the feed's god filter. The feed filters
 * by god **id**, and a page of rows only carries the gods that page happens to
 * use, so the dropdown has to come from the catalogue rather than the rows.
 */
export const godResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_active: z.boolean(),
  sort_order: z.number().nullable(),
})

export type GodResponseDto = z.infer<typeof godResponseSchema>

/** A god as the filter dropdown needs it. */
export interface BookingGod {
  readonly id: number
  readonly name: string
}

export function toBookingGod(dto: GodResponseDto): BookingGod {
  return { id: dto.id, name: dto.name }
}
