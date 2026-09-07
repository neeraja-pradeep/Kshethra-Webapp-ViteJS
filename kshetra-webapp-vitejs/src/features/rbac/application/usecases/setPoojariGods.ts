import type { Result } from '@/core/error/result'
import type { PoojariGods } from '@/features/rbac/domain/entities/poojari-god'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function setPoojariGods(
  userId: number,
  godIds: readonly number[],
  poojariName?: string,
): Promise<Result<PoojariGods>> {
  return rbacRepository.setPoojariGods(userId, godIds, poojariName)
}
