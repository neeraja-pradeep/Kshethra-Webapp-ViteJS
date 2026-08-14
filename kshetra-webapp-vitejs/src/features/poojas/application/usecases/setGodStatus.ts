import type { Result } from '@/core/error/result'

import type { God, GodStatus } from '@/features/poojas/domain/entities/god'
import { godRepository } from '@/features/poojas/infrastructure/repositories/god.repository.impl'

export function setGodStatus(id: number, status: GodStatus): Promise<Result<God>> {
  return godRepository.setGodStatus(id, status)
}
