import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { SessionUser } from '@/features/auth/domain/entities/session-user'
import type { AuthRepository, SignInCredentials } from '@/features/auth/domain/repositories/auth.repository'
import { getMyPermissions, postAdminSignIn, postLogout } from '@/features/auth/infrastructure/data-sources/remote/auth.api'
import { toSessionUser } from '@/features/auth/infrastructure/data-sources/remote/myPermissions.response'
import { toSignInRequest } from '@/features/auth/infrastructure/data-sources/remote/signIn.request'

export const authRepository: AuthRepository = {
  async signIn(credentials: SignInCredentials): Promise<Result<void>> {
    try {
      await postAdminSignIn(toSignInRequest(credentials))
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async signOut(): Promise<Result<void>> {
    try {
      await postLogout()
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchMyPermissions(): Promise<Result<SessionUser>> {
    try {
      return ok(toSessionUser(await getMyPermissions()))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
