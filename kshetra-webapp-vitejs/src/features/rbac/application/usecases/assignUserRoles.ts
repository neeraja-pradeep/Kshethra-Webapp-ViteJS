import type { Result } from '@/core/error/result'
import type { RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** Adds to what the user already holds. Idempotent. */
export function assignUserRoles(userId: number, roleIds: readonly number[]): Promise<Result<RbacUserDetail>> {
  return rbacRepository.assignUserRoles(userId, roleIds)
}
