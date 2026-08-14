import type { Result } from '@/core/error/result'
import type { RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** Deactivates the account. The row survives so past activity stays attributable. */
export function deactivateStaffUser(id: number): Promise<Result<RbacUserDetail>> {
  return rbacRepository.deactivateStaffUser(id)
}
