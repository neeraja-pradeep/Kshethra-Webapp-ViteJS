import type { Result } from '@/core/error/result'
import type {
  MediaTrack,
  MediaTrackDetail,
  MediaTrackPage,
  MediaTrackStatus,
  MediaTrackWrite,
} from '@/features/media/domain/entities/media-track'

/** Which tracks the *All tracks* dropdown asks for. */
export type MediaHomeScreenFilter = 'featured' | 'regular'

/**
 * Every filter here is applied by the server. Nothing is filtered client-side:
 * the list is paged, so narrowing one page would report a page's worth of
 * matches as though it were the whole screen.
 */
export interface MediaFilters {
  /** Case-insensitive partial match on **title or artist**. */
  readonly search?: string
  readonly status?: MediaTrackStatus
  readonly homeScreen?: MediaHomeScreenFilter
  /** A {@link MediaOrdering}, optionally `-` prefixed. Anything else is a 400. */
  readonly ordering?: string
  readonly page?: number
  /** Default 20, max 100 server-side. */
  readonly pageSize?: number
}

/**
 * The sortable columns. `track` sorts by title — the artist beneath it is a
 * subtitle, not a second sort key.
 */
export type MediaOrdering = 'track' | 'artist' | 'home_screen' | 'plays' | 'status' | 'uploaded_at'

export interface MediaRepository {
  fetchTracks(filters?: MediaFilters): Promise<Result<MediaTrackPage>>
  fetchTrack(id: number): Promise<Result<MediaTrackDetail>>
  /** Audio is mandatory here; `artist` is required by the API too. */
  createTrack(input: MediaTrackWrite): Promise<Result<MediaTrackDetail>>
  /** Partial: sending `audioFile` replaces the audio, `null` clears an image. */
  updateTrack(id: number, input: MediaTrackWrite): Promise<Result<MediaTrackDetail>>
  /** Returns the row, not the detail — and no summary, so the tiles need a refetch. */
  setTrackStatus(id: number, status: MediaTrackStatus): Promise<Result<MediaTrack>>
  /** Legal on an inactive track: "ready but not yet live" is a real state. */
  setTrackHomeScreen(id: number, homeScreen: boolean): Promise<Result<MediaTrack>>
  /** Permanent, with no server-side guard — takes the audio and art with it. */
  deleteTrack(id: number): Promise<Result<void>>
}
