import { Navigate } from 'react-router-dom'

import { firstVisiblePath } from '@/app/layout/nav'
import { useCan } from '@/features/auth/application/hooks/useCan'

/**
 * Where "/" lands. Dashboard is gated like every other module, so sending
 * everyone there would drop counter and store staff straight onto `/no-access`
 * the moment they sign in. Land them on their first reachable module instead.
 */
export function LandingRedirect() {
  const can = useCan()
  return <Navigate to={firstVisiblePath(can) ?? '/no-access'} replace />
}
