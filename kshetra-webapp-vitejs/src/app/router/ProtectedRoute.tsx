import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { toFailure } from '@/core/error/result'
import { Spinner } from '@/shared/ui'

import { useMyPermissionsQuery } from '@/features/auth/application/queries/useMyPermissionsQuery'

interface ProtectedRouteProps {
  children: ReactNode
  /**
   * Codenames the route needs on top of being signed in — ALL must be held,
   * matching the sidebar's rule. Empty means "any signed-in console user".
   */
  requires?: readonly string[]
}

/**
 * Gate for everything inside the console shell. The session query doubles as
 * the probe: it answers `401` when the cookie is missing or expired.
 */
export function ProtectedRoute({ children, requires = [] }: ProtectedRouteProps) {
  const { data: session, isPending, isError, error } = useMyPermissionsQuery()
  const location = useLocation()

  if (isPending) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-sunken">
        <Spinner size={32} />
      </div>
    )
  }

  if (isError || !session) {
    // Anything other than "not signed in" is still a dead end for the shell,
    // and the login screen is the only place that can recover from it.
    const failure = toFailure(error)
    return <Navigate to="/login" replace state={{ from: location.pathname, reason: failure?.message }} />
  }

  // A superuser bypasses every check server-side; mirror that here.
  const isAllowed = session.isSuperuser || requires.every((permission) => session.permissions.includes(permission))
  if (!isAllowed) return <Navigate to="/no-access" replace />

  return <>{children}</>
}
