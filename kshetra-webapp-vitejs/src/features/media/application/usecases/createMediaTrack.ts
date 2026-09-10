import type { Result } from '@/core/error/result'
import type { MediaTrackDetail, MediaTrackWrite } from '@/features/media/domain/entities/media-track'
import { mediaRepository } from '@/features/media/infrastructure/repositories/media.repository.impl'

export function createMediaTrack(input: MediaTrackWrite): Promise<Result<MediaTrackDetail>> {
  return mediaRepository.createTrack(input)
}
