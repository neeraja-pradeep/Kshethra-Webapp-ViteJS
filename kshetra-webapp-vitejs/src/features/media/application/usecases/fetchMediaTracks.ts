import type { Result } from '@/core/error/result'
import type { MediaTrackPage } from '@/features/media/domain/entities/media-track'
import type { MediaFilters } from '@/features/media/domain/repositories/media.repository'
import { mediaRepository } from '@/features/media/infrastructure/repositories/media.repository.impl'

export function fetchMediaTracks(filters?: MediaFilters): Promise<Result<MediaTrackPage>> {
  return mediaRepository.fetchTracks(filters)
}
