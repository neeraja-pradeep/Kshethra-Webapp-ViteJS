import type { Result } from '@/core/error/result'
import type { DeleteRoleOutcome } from '@/features/rbac/domain/entities/rbac-role'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** A `stillAssigned` outcome is the confirm step, not a failure. */
export function deleteRole(id: number, force?: boolean): Promise<Result<DeleteRoleOutcome>> {
  return rbacRepository.deleteRole(id, force)
}
