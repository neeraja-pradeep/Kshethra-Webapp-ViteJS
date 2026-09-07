import type { Result } from '@/core/error/result'
import type { PoojariGods } from '@/features/rbac/domain/entities/poojari-god'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function fetchPoojariGods(userId: number): Promise<Result<PoojariGods>> {
  return rbacRepository.fetchPoojariGods(userId)
}
