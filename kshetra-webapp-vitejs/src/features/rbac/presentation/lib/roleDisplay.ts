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

/**
 * Display name for a base role.
 *
 * The server labels every role it serves (`base_role_label` on each user row),
 * so prefer that: it is the same map the role dropdown reads, which is what
 * stops the list and the dropdown drifting apart — they once disagreed about
 * whether `temple_admin` reads "Admin" or "Temple Admin".
 *
 * The derivation below is only reached when the server sent no label: an older
 * backend, or a role name held locally with no row behind it. It title-cases
 * the raw name, so `counter_staff` still renders as "Counter Staff" rather
 * than blank.
 */
export function baseRoleLabel(baseRole: string, serverLabel?: string): string {
  if (serverLabel) return serverLabel
  return baseRole
    .split('_')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ')
}
