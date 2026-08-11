import type { Result } from '@/core/error/result'
import type { RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function fetchUser(id: number): Promise<Result<RbacUserDetail>> {
  return rbacRepository.fetchUser(id)
}
