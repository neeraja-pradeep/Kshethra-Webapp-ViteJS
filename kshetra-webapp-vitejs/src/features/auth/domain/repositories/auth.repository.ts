import type { Result } from '@/core/error/result'
import type { SessionUser } from '@/features/auth/domain/entities/session-user'

/** Credentials for the password sign-in stage. */
export interface SignInCredentials {
  readonly username: string
  readonly password: string
}

export interface AuthRepository {
  /** Signs in to the back office. Sets the session cookie as a side effect. */
  signIn(credentials: SignInCredentials): Promise<Result<void>>
  signOut(): Promise<Result<void>>
  /** The caller's identity and effective permissions — also the session probe. */
  fetchMyPermissions(): Promise<Result<SessionUser>>
}
