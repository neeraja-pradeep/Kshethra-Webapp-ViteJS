import type { Result } from '@/core/error/result'
import type { RbacRole } from '@/features/rbac/domain/entities/rbac-role'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function fetchRole(id: number): Promise<Result<RbacRole>> {
  return rbacRepository.fetchRole(id)
}
