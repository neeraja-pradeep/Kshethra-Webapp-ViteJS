import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { authKeys } from '@/features/auth/application/queries/auth.keys'
import { signIn } from '@/features/auth/application/usecases/signIn'
import type { SignInCredentials } from '@/features/auth/domain/repositories/auth.repository'

export function useSignInMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: SignInCredentials) => unwrap(await signIn(credentials)),
    onSuccess: async () => {
      // The session cookie is new — the permissions the guard reads must be too,
      // and awaiting this means the redirect never races an empty cache.
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
    },
  })
}
