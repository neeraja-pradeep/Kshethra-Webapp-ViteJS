import type { Result } from '@/core/error/result'
import type { MediaTrack } from '@/features/media/domain/entities/media-track'
import { mediaRepository } from '@/features/media/infrastructure/repositories/media.repository.impl'

export function setMediaTrackHomeScreen(id: number, homeScreen: boolean): Promise<Result<MediaTrack>> {
  return mediaRepository.setTrackHomeScreen(id, homeScreen)
}
