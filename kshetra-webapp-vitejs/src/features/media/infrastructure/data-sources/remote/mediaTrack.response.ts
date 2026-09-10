import { z } from 'zod'

import { paginated } from '@/core/api/wire'

import type {
  MediaSummary,
  MediaTrack,
  MediaTrackDetail,
} from '@/features/media/domain/entities/media-track'

/** Wire shapes for `admin/media/`. */

export const mediaStatusSchema = z.enum(['active', 'inactive'])

/** One row — also what both toggle endpoints answer with. */
export const mediaTrackRowSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
  cover_url: z.string().nullish(),
  home_screen: z.boolean(),
  play_count: z.number(),
  status: mediaStatusSchema,
  uploaded_at: z.string(),
})

/** `GET`/`POST`/`PATCH` on one track — the row plus the three detail fields. */
export const mediaTrackDetailSchema = mediaTrackRowSchema.extend({
  audio_filename: z.string().nullish(),
  home_cover_url: z.string().nullish(),
  /** Seconds as a float, read off the upload rather than typed by hand. */
  duration: z.number().nullish(),
})

const summarySchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
})

/** The list: a DRF page with `summary` sitting **beside** `results`. */
export const mediaTrackPageSchema = paginated(mediaTrackRowSchema).extend({
  summary: summarySchema,
})

export type MediaTrackRowDto = z.infer<typeof mediaTrackRowSchema>
export type MediaTrackDetailDto = z.infer<typeof mediaTrackDetailSchema>
export type MediaTrackPageDto = z.infer<typeof mediaTrackPageSchema>

export function toMediaTrack(dto: MediaTrackRowDto): MediaTrack {
  return {
    id: dto.id,
    title: dto.title,
    artist: dto.artist,
    coverUrl: dto.cover_url ?? null,
    homeScreen: dto.home_screen,
    playCount: dto.play_count,
    status: dto.status,
    uploadedAt: dto.uploaded_at,
  }
}

export function toMediaTrackDetail(dto: MediaTrackDetailDto): MediaTrackDetail {
  return {
    ...toMediaTrack(dto),
    audioFilename: dto.audio_filename ?? null,
    homeCoverUrl: dto.home_cover_url ?? null,
    duration: dto.duration ?? null,
  }
}

export function toMediaSummary(dto: z.infer<typeof summarySchema>): MediaSummary {
  return { total: dto.total, active: dto.active, inactive: dto.inactive }
}
