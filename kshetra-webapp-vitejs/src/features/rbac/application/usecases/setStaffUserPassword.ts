import type { Result } from '@/core/error/result'
import type { RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** Its own endpoint so a routine profile edit cannot change a password by accident. */
export function setStaffUserPassword(id: number, password: string): Promise<Result<RbacUserDetail>> {
  return rbacRepository.setStaffUserPassword(id, password)
}
