import type { Result } from '@/core/error/result'
import { mediaRepository } from '@/features/media/infrastructure/repositories/media.repository.impl'

export function deleteMediaTrack(id: number): Promise<Result<void>> {
  return mediaRepository.deleteTrack(id)
}
