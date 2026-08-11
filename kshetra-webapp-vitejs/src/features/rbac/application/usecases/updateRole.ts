import type { Result } from '@/core/error/result'
import type { RbacRole, UpdateRoleInput } from '@/features/rbac/domain/entities/rbac-role'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** `changes.permissions`, when present, replaces the role's whole set. */
export function updateRole(id: number, changes: UpdateRoleInput): Promise<Result<RbacRole>> {
  return rbacRepository.updateRole(id, changes)
}
