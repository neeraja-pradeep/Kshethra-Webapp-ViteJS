import type { Result } from '@/core/error/result'
import type { CreateStaffUserInput, RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

/** Creates a staff account with a base role. Devotees sign themselves up instead. */
export function createStaffUser(input: CreateStaffUserInput): Promise<Result<RbacUserDetail>> {
  return rbacRepository.createStaffUser(input)
}
