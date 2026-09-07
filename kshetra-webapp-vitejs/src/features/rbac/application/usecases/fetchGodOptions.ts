import type { Result } from '@/core/error/result'
import type { PoojariGodOption } from '@/features/rbac/domain/entities/poojari-god'
import { rbacRepository } from '@/features/rbac/infrastructure/repositories/rbac.repository.impl'

export function fetchGodOptions(): Promise<Result<readonly PoojariGodOption[]>> {
  return rbacRepository.fetchGodOptions()
}
