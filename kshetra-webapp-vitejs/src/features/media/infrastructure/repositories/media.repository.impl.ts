import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type {
  MediaTrack,
  MediaTrackDetail,
  MediaTrackPage,
  MediaTrackStatus,
  MediaTrackWrite,
} from '@/features/media/domain/entities/media-track'
import type { MediaFilters, MediaRepository } from '@/features/media/domain/repositories/media.repository'
import {
  toMediaSummary,
  toMediaTrack,
  toMediaTrackDetail,
} from '@/features/media/infrastructure/data-sources/remote/mediaTrack.response'
import {
  deleteMediaTrack,
  getMediaTrack,
  getMediaTracks,
  patchMediaTrack,
  patchMediaTrackHomeScreen,
  patchMediaTrackStatus,
  postMediaTrack,
} from '@/features/media/infrastructure/data-sources/remote/media.api'

export const mediaRepository: MediaRepository = {
  async fetchTracks(filters: MediaFilters = {}): Promise<Result<MediaTrackPage>> {
    try {
      const page = await getMediaTracks(filters)
      return ok({
        count: page.count,
        results: page.results.map(toMediaTrack),
        summary: toMediaSummary(page.summary),
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchTrack(id: number): Promise<Result<MediaTrackDetail>> {
    try {
      return ok(toMediaTrackDetail(await getMediaTrack(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createTrack(input: MediaTrackWrite): Promise<Result<MediaTrackDetail>> {
    try {
      return ok(toMediaTrackDetail(await postMediaTrack(input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async updateTrack(id: number, input: MediaTrackWrite): Promise<Result<MediaTrackDetail>> {
    try {
      return ok(toMediaTrackDetail(await patchMediaTrack(id, input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setTrackStatus(id: number, status: MediaTrackStatus): Promise<Result<MediaTrack>> {
    try {
      return ok(toMediaTrack(await patchMediaTrackStatus(id, status)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setTrackHomeScreen(id: number, homeScreen: boolean): Promise<Result<MediaTrack>> {
    try {
      return ok(toMediaTrack(await patchMediaTrackHomeScreen(id, homeScreen)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async deleteTrack(id: number): Promise<Result<void>> {
    try {
      await deleteMediaTrack(id)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
