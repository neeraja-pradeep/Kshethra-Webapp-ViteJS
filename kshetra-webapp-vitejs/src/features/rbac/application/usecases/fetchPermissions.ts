import type { Result } from '@/core/error/result'
import type { PermissionCatalogue } from '@/features/rbac/domain/entities/permission'
import type { PermissionFilters } from '@/features/rbac/domain/repositories/rbac.repository'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function fetchPermissions(filters?: PermissionFilters): Promise<Result<PermissionCatalogue>> {
  return rbacRepository.fetchPermissions(filters)
}
