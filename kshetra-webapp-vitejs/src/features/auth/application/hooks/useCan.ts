import { useCallback } from 'react'

import { useMyPermissionsQuery } from '@/features/auth/application/queries/useMyPermissionsQuery'

/**
 * Permission check for driving the UI.
 *
 * Hiding a control is UX, not security — the server enforces every rule
 * regardless, so a missing check is a bad experience, not a hole.
 */
export function useCan(): (permission: string) => boolean {
  const { data } = useMyPermissionsQuery()

  return useCallback(
    (permission: string) => {
      if (!data) return false
      // A superuser bypasses every check server-side; mirror that here.
      return data.isSuperuser || data.permissions.includes(permission)
    },
    [data],
  )
}

/** Convenience for the common "needs all of these" case. */
export function useCanAll(permissions: readonly string[]): boolean {
  const can = useCan()
  return permissions.every(can)
}
