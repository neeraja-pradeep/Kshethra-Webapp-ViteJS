import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { authKeys } from '@/features/auth/application/queries/auth.keys'
import { rbacKeys } from '@/features/rbac/application/queries/rbac.keys'

/**
 * What every RBAC write has to invalidate.
 *
 * The non-obvious half is `authKeys.session()`. Role changes take effect on the
 * holder's next request with no re-login, but the console trusts a session's
 * permissions for five minutes — so an admin who edits their own roles would
 * keep the old menus and route guards until that window elapsed. Refreshing the
 * session after every write is what makes the server's "immediate" actually
 * immediate on screen.
 */
export function useRbacInvalidation(): () => Promise<void> {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: rbacKeys.all }),
      queryClient.invalidateQueries({ queryKey: authKeys.session() }),
    ])
  }, [queryClient])
}
