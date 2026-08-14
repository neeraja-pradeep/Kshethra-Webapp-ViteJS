import type { Result } from '@/core/error/result'
import type { SetRolesOutcome } from '@/features/rbac/domain/entities/rbac-user'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** Replaces the user's whole custom-role set; `[]` clears it. */
export function setUserRoles(userId: number, roleIds: readonly number[]): Promise<Result<SetRolesOutcome>> {
  return rbacRepository.setUserRoles(userId, roleIds)
}
