import type { Result } from '@/core/error/result'
import type { RbacRole } from '@/features/rbac/domain/entities/rbac-role'
import type { Page, RoleFilters } from '@/features/rbac/domain/repositories/rbac.repository'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function fetchRoles(filters?: RoleFilters): Promise<Result<Page<RbacRole>>> {
  return rbacRepository.fetchRoles(filters)
}
