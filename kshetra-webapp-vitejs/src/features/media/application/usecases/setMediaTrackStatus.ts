import type { Result } from '@/core/error/result'
import type { MediaTrack, MediaTrackStatus } from '@/features/media/domain/entities/media-track'
import { mediaRepository } from '@/features/media/infrastructure/repositories/media.repository.impl'

export function setMediaTrackStatus(id: number, status: MediaTrackStatus): Promise<Result<MediaTrack>> {
  return mediaRepository.setTrackStatus(id, status)
}
