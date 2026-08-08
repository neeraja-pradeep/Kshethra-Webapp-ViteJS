import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { signOut } from '@/features/auth/application/usecases/signOut'

export function useSignOutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => unwrap(await signOut()),
    // Drop every cached response, not just the session: the next operator at
    // this till must not see the previous one's data.
    onSettled: () => queryClient.clear(),
  })
}
