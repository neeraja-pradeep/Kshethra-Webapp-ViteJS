import { z } from 'zod'

import type { God, GodsSummary } from '@/features/poojas/domain/entities/god'
import { godStatusFromActive } from '@/features/poojas/domain/entities/god'

const text = z.string().nullish()

/**
 * Wire shape of `booking/poojacategory/`.
 *
 * `parent` and `children` are declared but not mapped. The Gods screen is flat
 * and always sends `parent: null`, but the field is live — a god with children
 * cannot be deleted — so it is documented here rather than pretended away.
 */
export const godResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent: z.number().nullish(),
  poojas_count: z.number().default(0),
  media_url: text,
  media_public_id: text,
  home_media_url: text,
  home_media_public_id: text,
  is_active: z.boolean(),
  sort_order: z.number().nullish(),
})

export const godsSummarySchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
  next_sort_order: z.number(),
})

/**
 * The list envelope. `next`/`previous` only appear on a paged read, which this
 * screen never asks for, so both are optional and either shape parses.
 */
export const godListResponseSchema = z.object({
  count: z.number(),
  next: text,
  previous: text,
  results: z.array(godResponseSchema),
  summary: godsSummarySchema,
})

/**
 * Create and update wrap the god as `{message, data}`; the detail read does
 * not. Accept either and hand back the god, so one mapper serves both and a
 * caller never has to know which shape it asked for.
 */
export const godWriteResponseSchema = z.union([
  z.object({ data: godResponseSchema }).transform((wrapper) => wrapper.data),
  godResponseSchema,
])

/** Reorder answers with the reordered list; accept it enveloped or bare. */
export const reorderGodsResponseSchema = z.union([
  z.object({ results: z.array(godResponseSchema) }).transform((wrapper) => wrapper.results),
  z.array(godResponseSchema),
])

export type GodResponseDto = z.infer<typeof godResponseSchema>
export type GodsSummaryDto = z.infer<typeof godsSummarySchema>

export function toGod(dto: GodResponseDto): God {
  return {
    id: dto.id,
    name: dto.name,
    poojasCount: dto.poojas_count,
    mediaUrl: dto.media_url ?? null,
    homeMediaUrl: dto.home_media_url ?? null,
    status: godStatusFromActive(dto.is_active),
    sortOrder: dto.sort_order ?? 0,
  }
}

export function toGodsSummary(dto: GodsSummaryDto): GodsSummary {
  return {
    total: dto.total,
    active: dto.active,
    inactive: dto.inactive,
    nextSortOrder: dto.next_sort_order,
  }
}
