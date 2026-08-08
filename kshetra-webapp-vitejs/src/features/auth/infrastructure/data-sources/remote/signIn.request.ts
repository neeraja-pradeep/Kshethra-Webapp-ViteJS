import type { SignInCredentials } from '@/features/auth/domain/repositories/auth.repository'

/** Wire shape of `POST auth/admin-signin/`. */
export interface SignInRequestDto {
  readonly username: string
  readonly password: string
}

export function toSignInRequest(credentials: SignInCredentials): SignInRequestDto {
  return { username: credentials.username.trim(), password: credentials.password }
}
