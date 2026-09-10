import { http } from '@/core/api/http'
import { MULTIPART_REQUEST, toFormData, hasFiles, type MultipartValue } from '@/core/api/multipart'
import { MEDIA_ENDPOINTS } from '@/core/config/endpoints'

import type { MediaTrackStatus, MediaTrackWrite } from '@/features/media/domain/entities/media-track'
import type { MediaFilters } from '@/features/media/domain/repositories/media.repository'
import {
  mediaTrackDetailSchema,
  mediaTrackPageSchema,
  mediaTrackRowSchema,
  type MediaTrackDetailDto,
  type MediaTrackPageDto,
  type MediaTrackRowDto,
} from '@/features/media/infrastructure/data-sources/remote/mediaTrack.response'

/** Only keys the caller actually set are sent — an empty one means "no filter". */
function toParams(filters: MediaFilters): Record<string, string | number> {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.homeScreen ? { home_screen: filters.homeScreen } : {}),
    ...(filters.ordering ? { ordering: filters.ordering } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.pageSize ? { page_size: filters.pageSize } : {}),
  }
}

/**
 * The form's fields, in the server's shape.
 *
 * Only keys the caller set are sent: on a PATCH **`null` clears and absent
 * leaves alone**, so a cleared cover must arrive as an explicit null while an
 * untouched one must not arrive at all.
 */
function toWriteFields(input: MediaTrackWrite): Record<string, MultipartValue> {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.artist !== undefined ? { artist: input.artist } : {}),
    ...(input.audioFile !== undefined ? { audio_file: input.audioFile } : {}),
    ...(input.cover !== undefined ? { cover: input.cover } : {}),
    ...(input.homeCover !== undefined ? { home_cover: input.homeCover } : {}),
    ...(input.homeScreen !== undefined ? { home_screen: input.homeScreen } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  }
}

/**
 * Multipart when there is a file, JSON otherwise.
 *
 * The endpoints take either, and JSON keeps a text-only edit — a rename, a
 * status change — from being posted as a form with no file in it.
 */
function toWriteRequest(input: MediaTrackWrite): [unknown, typeof MULTIPART_REQUEST | undefined] {
  const fields = toWriteFields(input)
  return hasFiles(fields) ? [toFormData(fields), MULTIPART_REQUEST] : [fields, undefined]
}

export async function getMediaTracks(filters: MediaFilters = {}): Promise<MediaTrackPageDto> {
  const response = await http.get(MEDIA_ENDPOINTS.tracks, { params: toParams(filters) })
  return mediaTrackPageSchema.parse(response.data)
}

export async function getMediaTrack(id: number): Promise<MediaTrackDetailDto> {
  const response = await http.get(MEDIA_ENDPOINTS.track(id))
  return mediaTrackDetailSchema.parse(response.data)
}

/** Always multipart in practice — audio is mandatory and cannot travel as JSON. */
export async function postMediaTrack(input: MediaTrackWrite): Promise<MediaTrackDetailDto> {
  const [body, config] = toWriteRequest(input)
  const response = await http.post(MEDIA_ENDPOINTS.newTrack, body, config)
  return mediaTrackDetailSchema.parse(response.data)
}

export async function patchMediaTrack(id: number, input: MediaTrackWrite): Promise<MediaTrackDetailDto> {
  const [body, config] = toWriteRequest(input)
  const response = await http.patch(MEDIA_ENDPOINTS.track(id), body, config)
  return mediaTrackDetailSchema.parse(response.data)
}

/** Both toggles answer with the **row**, not the detail — and carry no summary. */
export async function patchMediaTrackStatus(id: number, status: MediaTrackStatus): Promise<MediaTrackRowDto> {
  const response = await http.patch(MEDIA_ENDPOINTS.trackStatus(id), { status })
  return mediaTrackRowSchema.parse(response.data)
}

export async function patchMediaTrackHomeScreen(id: number, homeScreen: boolean): Promise<MediaTrackRowDto> {
  const response = await http.patch(MEDIA_ENDPOINTS.trackHomeScreen(id), { home_screen: homeScreen })
  return mediaTrackRowSchema.parse(response.data)
}

/** `204` with an empty body. No guard and no undo — confirm before calling. */
export async function deleteMediaTrack(id: number): Promise<void> {
  await http.delete(MEDIA_ENDPOINTS.track(id))
}
