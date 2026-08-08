import { useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { authKeys } from '@/features/auth/application/queries/auth.keys'
import { fetchMyPermissions } from '@/features/auth/application/usecases/fetchMyPermissions'

/** How long a session's permissions are trusted before a background refresh. */
const SESSION_STALE_TIME_MS = 5 * 60 * 1000

/**
 * The signed-in session. This is server data, so the query cache owns it —
 * copying it into a store would create a second source of truth that drifts
 * when an admin changes someone's role mid-shift.
 *
 * Doubles as the session probe: a `401` here means "not signed in".
 */
export function useMyPermissionsQuery() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => unwrap(await fetchMyPermissions()),
    staleTime: SESSION_STALE_TIME_MS,
    // Signed out is an answer, not a transient fault worth retrying.
    retry: false,
  })
}
