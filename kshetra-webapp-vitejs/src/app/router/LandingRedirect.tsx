import { Navigate } from 'react-router-dom'

import { firstVisiblePath } from '@/app/layout/nav'
import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import { useMyPermissionsQuery } from '@/features/auth/application/queries/useMyPermissionsQuery'

/**
 * Where "/" lands, and where sign-in sends every operator.
 *
 * Dashboard is gated like every other module, so sending everyone there drops
 * counter staff, store staff and anyone else without `view_admin_dashboard`
 * straight onto `/no-access` the moment they sign in. Land them on their first
 * reachable module instead.
 *
 * `/no-access` is reserved for somebody who genuinely has nowhere to go: it is
 * reached only when the console-entry permission is missing, or when not one
 * NAV entry resolves. Anything else would tell a working operator they have no
 * access while their sidebar sits beside the message, full of links.
 */
export function LandingRedirect() {
  const can = useCan()
  const { data: session } = useMyPermissionsQuery()
  if (!can(PERMISSIONS.accessAdminPortal)) return <Navigate to="/no-access" replace />
  // Restricted roles land inside their own allowlist, so a reports manager
  // opens on Reports rather than on whichever granted module sits highest.
  return <Navigate to={firstVisiblePath(can, session?.baseRole) ?? '/no-access'} replace />
}
