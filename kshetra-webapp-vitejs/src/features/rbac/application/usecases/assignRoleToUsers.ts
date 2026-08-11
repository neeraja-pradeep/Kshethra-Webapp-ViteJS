import type { Result } from '@/core/error/result'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function assignRoleToUsers(roleId: number, userIds: readonly number[]): Promise<Result<void>> {
  return rbacRepository.assignRoleToUsers(roleId, userIds)
}
