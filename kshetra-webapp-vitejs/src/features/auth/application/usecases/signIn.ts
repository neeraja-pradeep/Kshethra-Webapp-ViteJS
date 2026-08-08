import type { Result } from '@/core/error/result'
import type { SignInCredentials } from '@/features/auth/domain/repositories/auth.repository'
import { authRepository } from '@/features/auth/infrastructure/repositories/auth.repository.impl'

export function signIn(credentials: SignInCredentials): Promise<Result<void>> {
  return authRepository.signIn(credentials)
}
