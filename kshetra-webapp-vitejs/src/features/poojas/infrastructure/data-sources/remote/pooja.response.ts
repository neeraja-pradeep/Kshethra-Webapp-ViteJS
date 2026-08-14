import { z } from 'zod'

import { decimal } from '@/core/api/wire'

import {
  poojaStatusFromActive,
  type GodBrief,
  type Pooja,
  type PoojaBlock,
  type PoojasSummary,
  type SpecialPoojaDate,
} from '@/features/poojas/domain/entities/pooja'
import type { PoojaAvailability } from '@/features/poojas/domain/entities/pooja-availability'

const text = z.string().nullish()

export const godBriefSchema = z.object({
  id: z.number(),
  name: z.string(),
  media_url: text,
  home_media_url: text,
  sort_order: z.number().nullish(),
})

export const specialPoojaDateSchema = z.object({
  id: z.number(),
  date: z.string(),
  time: text,
  online_price: decimal.nullish(),
  offline_price: decimal.nullish(),
  banner: z.boolean().default(false),
})

export const poojaBlockSchema = z.object({
  id: z.number(),
  start_date: z.string(),
  end_date: text,
  days: z.number().default(1),
  reason: text,
  created_by_name: text,
  created_at: text,
})

export const poojaResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.number().nullish(),
  category_name: text,
  gods: z.array(godBriefSchema).default([]),
  god_ids: z.array(z.number()).default([]),
  god_names: z.array(z.string()).default([]),
  offline_price: decimal.nullish(),
  online_price: decimal.nullish(),
  poojari_incentive: decimal.nullish(),
  status: z.boolean(),
  special_pooja: z.boolean().default(false),
  sort_order: z.number().nullish(),
  banner_desc: text,
  card_desc: text,
  captions_desc: text,
  media_url: text,
  banner_url: text,
  special_pooja_dates: z.array(specialPoojaDateSchema).default([]),
  unavailable_dates: z.array(poojaBlockSchema).default([]),
})

export const poojasSummarySchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
  special: z.number(),
  next_sort_order: z.number(),
})

/** `next`/`previous` only appear on a paged read, so both are optional. */
export const poojaPageResponseSchema = z.object({
  count: z.number(),
  next: text,
  previous: text,
  results: z.array(poojaResponseSchema),
  summary: poojasSummarySchema,
})

/**
 * Create, update and duplicate may hand the pooja back bare or wrapped as
 * `{message, data}`. Accept either, so one mapper serves every write.
 */
export const poojaWriteResponseSchema = z.union([
  z.object({ data: poojaResponseSchema }).transform((wrapper) => wrapper.data),
  poojaResponseSchema,
])

export const blockWriteResponseSchema = z.union([
  z.object({ block: poojaBlockSchema }).transform((wrapper) => wrapper.block),
  poojaBlockSchema,
])

export const availabilityResponseSchema = z.object({
  start: z.string(),
  end: z.string(),
  blocked_dates: z.array(z.string()).default([]),
  blocks: z.array(poojaBlockSchema).default([]),
  /** `null` for a regular pooja — bookable any day the temple has not blocked. */
  bookable_dates: z.array(z.string()).nullable().default(null),
})

export const bulkStatusResponseSchema = z.object({
  message: z.string(),
  updated_count: z.number().default(0),
  updated_ids: z.array(z.number()).default([]),
  not_found: z.array(z.number()).default([]),
})

export const bulkDeleteResponseSchema = z.object({
  message: z.string(),
  deleted_count: z.number().default(0),
  deleted_ids: z.array(z.number()).default([]),
  skipped: z.array(z.object({ id: z.number(), name: z.string(), reason: z.string() })).default([]),
  not_found: z.array(z.number()).default([]),
})

export const importResponseSchema = z.object({
  message: z.string(),
  total_rows: z.number().default(0),
  created_count: z.number().default(0),
  failed_count: z.number().default(0),
  errors: z
    .array(
      z.object({
        row: z.number(),
        column: text,
        value: z.union([z.string(), z.number()]).nullish(),
        error: z.string(),
      }),
    )
    .default([]),
})

export type PoojaResponseDto = z.infer<typeof poojaResponseSchema>
export type PoojasSummaryDto = z.infer<typeof poojasSummarySchema>
export type PoojaBlockDto = z.infer<typeof poojaBlockSchema>
export type AvailabilityDto = z.infer<typeof availabilityResponseSchema>
export type BulkStatusDto = z.infer<typeof bulkStatusResponseSchema>
export type BulkDeleteDto = z.infer<typeof bulkDeleteResponseSchema>
export type ImportDto = z.infer<typeof importResponseSchema>

function toGodBrief(dto: z.infer<typeof godBriefSchema>): GodBrief {
  return {
    id: dto.id,
    name: dto.name,
    mediaUrl: dto.media_url ?? null,
    homeMediaUrl: dto.home_media_url ?? null,
    sortOrder: dto.sort_order ?? 0,
  }
}

function toSpecialPoojaDate(dto: z.infer<typeof specialPoojaDateSchema>): SpecialPoojaDate {
  return {
    id: dto.id,
    date: dto.date,
    time: dto.time ?? '',
    onlinePrice: dto.online_price ?? null,
    offlinePrice: dto.offline_price ?? null,
    banner: dto.banner,
  }
}

export function toPoojaBlock(dto: PoojaBlockDto): PoojaBlock {
  return {
    id: dto.id,
    startDate: dto.start_date,
    // A single-day block comes back with no end; collapsing it here means the
    // UI never has to ask which of the two shapes it is holding.
    endDate: dto.end_date ?? dto.start_date,
    days: dto.days,
    reason: dto.reason ?? '',
    createdByName: dto.created_by_name ?? '',
    createdAt: dto.created_at ?? '',
  }
}

export function toPooja(dto: PoojaResponseDto): Pooja {
  const gods = dto.gods.map(toGodBrief)
  return {
    id: dto.id,
    name: dto.name,
    gods,
    // The write response omits `god_ids`, so fall back to the nested gods it
    // does carry rather than handing the form an empty list.
    godIds: dto.god_ids.length ? dto.god_ids : gods.map((god) => god.id),
    godNames: dto.god_names.length ? dto.god_names : gods.map((god) => god.name),
    offlinePrice: dto.offline_price ?? 0,
    onlinePrice: dto.online_price ?? 0,
    poojariIncentive: dto.poojari_incentive ?? 0,
    status: poojaStatusFromActive(dto.status),
    special: dto.special_pooja,
    sortOrder: dto.sort_order ?? 0,
    bannerDesc: dto.banner_desc ?? '',
    cardDesc: dto.card_desc ?? '',
    captionsDesc: dto.captions_desc ?? '',
    mediaUrl: dto.media_url ?? null,
    bannerUrl: dto.banner_url ?? null,
    specialPoojaDates: dto.special_pooja_dates.map(toSpecialPoojaDate),
    unavailableDates: dto.unavailable_dates.map(toPoojaBlock),
  }
}

export function toPoojasSummary(dto: PoojasSummaryDto): PoojasSummary {
  return {
    total: dto.total,
    active: dto.active,
    inactive: dto.inactive,
    special: dto.special,
    nextSortOrder: dto.next_sort_order,
  }
}

export function toAvailability(dto: AvailabilityDto): PoojaAvailability {
  return {
    start: dto.start,
    end: dto.end,
    blockedDates: dto.blocked_dates,
    blocks: dto.blocks.map(toPoojaBlock),
    bookableDates: dto.bookable_dates,
  }
}
