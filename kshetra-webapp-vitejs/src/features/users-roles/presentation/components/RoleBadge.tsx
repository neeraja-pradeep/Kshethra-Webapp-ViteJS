import { Badge } from '@/shared/ui'
import { findRole, roleBadgeColor } from '@/features/users-roles/presentation/utils/roles'

export interface RoleBadgeProps {
  roleId: string
}

/** Small pill showing a user's role label, coloured by the role's broad kind. */
export function RoleBadge({ roleId }: RoleBadgeProps) {
  return (
    <Badge color={roleBadgeColor(roleId)} size="sm">
      {findRole(roleId).label}
    </Badge>
  )
}
