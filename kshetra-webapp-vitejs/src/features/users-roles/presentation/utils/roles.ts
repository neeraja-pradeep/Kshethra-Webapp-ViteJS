import type { BadgeColor } from '@/shared/ui'
import type { God } from '@/features/users-roles/domain/entities/god'
import type { Role, RoleKind } from '@/features/users-roles/domain/entities/role'
import { ROLES } from '@/features/users-roles/presentation/data/roles.mock'

/** Looks up a role by id, falling back to the first role (never throws). */
export function findRole(roleId: string): Role {
  return ROLES.find((r) => r.id === roleId) ?? ROLES[0]
}

const KIND_COLOR: Record<RoleKind, BadgeColor> = {
  admin: 'maroon',
  manager: 'blue',
  counter: 'green',
  store: 'amber',
  poojari: 'gray',
}

/** Badge colour for a role, keyed by its broad kind. */
export function roleBadgeColor(roleId: string): BadgeColor {
  return KIND_COLOR[findRole(roleId).kind]
}

/** Display name for a god id; title-cases the id itself if not found. */
export function findGodName(gods: readonly God[], godId: string): string {
  const g = gods.find((x) => x.id === godId)
  if (g) return g.name
  return godId ? godId.charAt(0).toUpperCase() + godId.slice(1) : ''
}

/** Strips non-digits so phone numbers can be compared regardless of formatting. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}
