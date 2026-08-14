import type { BadgeColor } from '@/shared/ui'

/**
 * Role display helpers.
 *
 * These live in `rbac/` because roles are an rbac concept: the users screen
 * renders them, but it does not own them. Keeping them here is what lets the
 * dependency run one way — `users-roles/` reaches into `rbac/`, never back.
 *
 * Roles are server-defined and unbounded, so nothing here can be a lookup into
 * a fixed table: an admin can create "Front Desk" this afternoon and it must
 * render correctly without a deploy.
 */

/** Palette for custom roles. `red` is reserved for destructive UI. */
const ROLE_COLORS: readonly BadgeColor[] = ['blue', 'green', 'amber', 'maroon']

/**
 * A stable colour per role. Derived from the role's permanent `name` rather
 * than assigned in sequence, so a role keeps its colour as others are created
 * and deleted around it.
 */
export function roleBadgeColor(roleName: string): BadgeColor {
  let hash = 0
  for (let i = 0; i < roleName.length; i += 1) hash = (hash * 31 + roleName.charCodeAt(i)) % 997
  return ROLE_COLORS[hash % ROLE_COLORS.length]
}

/** The three fixed base roles, which decide which sign-in endpoint accepts a user. */
const BASE_ROLE_LABELS: Readonly<Record<string, string>> = {
  temple_user: 'Devotee',
  temple_poojari: 'Poojari',
  temple_admin: 'Temple Admin',
}

/** Display name for a base role; title-cases anything unrecognised. */
export function baseRoleLabel(baseRole: string): string {
  const known = BASE_ROLE_LABELS[baseRole]
  if (known) return known
  return baseRole
    .split('_')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ')
}
