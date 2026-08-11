import type { Result } from '@/core/error/result'
import type { RbacUser } from '@/features/rbac/domain/entities/rbac-user'
import type { Page } from '@/features/rbac/domain/repositories/rbac.repository'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function fetchRoleUsers(id: number, page?: number): Promise<Result<Page<RbacUser>>> {
  return rbacRepository.fetchRoleUsers(id, page)
}
