import type { Result } from '@/core/error/result'
import type { MediaTrackDetail } from '@/features/media/domain/entities/media-track'
import { mediaRepository } from '@/features/media/infrastructure/repositories/media.repository.impl'

export function fetchMediaTrack(id: number): Promise<Result<MediaTrackDetail>> {
  return mediaRepository.fetchTrack(id)
}
