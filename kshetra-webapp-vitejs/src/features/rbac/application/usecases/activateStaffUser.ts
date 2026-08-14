import type { Result } from '@/core/error/result'
import type { RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** Undoes a deactivation. */
export function activateStaffUser(id: number): Promise<Result<RbacUserDetail>> {
  return rbacRepository.activateStaffUser(id)
}
