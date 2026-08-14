import type { Result } from '@/core/error/result'
import type { RbacUserDetail, UpdateStaffUserInput } from '@/features/rbac/domain/entities/rbac-user'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** Edits identity and base role. `username` is permanent and not accepted. */
export function updateStaffUser(id: number, changes: UpdateStaffUserInput): Promise<Result<RbacUserDetail>> {
  return rbacRepository.updateStaffUser(id, changes)
}
