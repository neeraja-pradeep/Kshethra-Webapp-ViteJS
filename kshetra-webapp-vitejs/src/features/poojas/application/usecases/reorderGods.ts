import type { Result } from '@/core/error/result'

import type { God } from '@/features/poojas/domain/entities/god'
import { godRepository } from '@/features/poojas/infrastructure/repositories/god.repository.impl'

export function reorderGods(orderedIds: readonly number[]): Promise<Result<readonly God[]>> {
  return godRepository.reorderGods(orderedIds)
}
