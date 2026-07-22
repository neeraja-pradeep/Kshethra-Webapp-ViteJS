import { Badge } from '@/shared/ui'
import type { UserStatus } from '@/features/users-roles/domain/entities/user'

export interface StatusBadgeProps {
  status: UserStatus
}

/** Active → green, Inactive → gray. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge color={status === 'Active' ? 'green' : 'gray'} size="sm">
      {status}
    </Badge>
  )
}
