import { Badge } from '@/shared/ui'
import { baseRoleLabel, roleBadgeColor } from '@/features/users-roles/presentation/utils/roles'

export interface RoleBadgeProps {
  /** The role's permanent `name` — decides the colour. */
  name: string
  /** The display label. */
  label: string
  /** Base roles render neutral: they are a property of the account, not a grant. */
  variant?: 'custom' | 'base'
}

/** Small pill for one role. Colour is derived from the name, so it survives renames. */
export function RoleBadge({ name, label, variant = 'custom' }: RoleBadgeProps) {
  return (
    <Badge color={variant === 'base' ? 'gray' : roleBadgeColor(name)} size="sm">
      {label}
    </Badge>
  )
}

/** The base-role pill, labelled from the server's `base_role` value. */
export function BaseRoleBadge({ baseRole }: { baseRole: string }) {
  return <RoleBadge name={baseRole} label={baseRoleLabel(baseRole)} variant="base" />
}
