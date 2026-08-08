import type { Result } from '@/core/error/result'
import { authRepository } from '@/features/auth/infrastructure/repositories/auth.repository.impl'

export function signOut(): Promise<Result<void>> {
  return authRepository.signOut()
}
