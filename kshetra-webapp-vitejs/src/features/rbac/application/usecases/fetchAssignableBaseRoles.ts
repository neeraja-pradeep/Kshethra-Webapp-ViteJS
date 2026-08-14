import type { Result } from '@/core/error/result'
import type { AssignableBaseRole } from '@/features/rbac/domain/entities/rbac-user'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** The staff roles the base-role dropdown may offer. Devotee is never among them. */
export function fetchAssignableBaseRoles(): Promise<Result<readonly AssignableBaseRole[]>> {
  return rbacRepository.fetchAssignableBaseRoles()
}
