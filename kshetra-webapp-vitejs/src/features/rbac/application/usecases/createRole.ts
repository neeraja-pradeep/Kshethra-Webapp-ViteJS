import type { Result } from '@/core/error/result'
import type { CreateRoleInput, RbacRole } from '@/features/rbac/domain/entities/rbac-role'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function createRole(input: CreateRoleInput): Promise<Result<RbacRole>> {
  return rbacRepository.createRole(input)
}
