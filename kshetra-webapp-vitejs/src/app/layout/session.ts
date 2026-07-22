import type { SessionUser } from '@/shared/types/common'

/**
 * Static signed-in operator for the prototype. Replaced by the auth session
 * store (Zustand) + /me query when API integration lands.
 */
export const SESSION_USER: SessionUser = {
  name: 'Aravind Nair',
  role: 'Admin',
  scope: 'All temples',
}
