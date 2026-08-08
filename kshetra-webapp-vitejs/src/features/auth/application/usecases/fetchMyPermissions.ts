import type { Result } from '@/core/error/result'
import type { SessionUser } from '@/features/auth/domain/entities/session-user'
import { authRepository } from '@/features/auth/infrastructure/repositories/auth.repository.impl'

export function fetchMyPermissions(): Promise<Result<SessionUser>> {
  return authRepository.fetchMyPermissions()
}
