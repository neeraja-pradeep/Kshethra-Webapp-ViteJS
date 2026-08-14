import type { Result } from '@/core/error/result'

import type { BulkDeleteOutcome } from '@/features/poojas/domain/repositories/pooja.repository'
import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function bulkDeletePoojas(ids: readonly number[]): Promise<Result<BulkDeleteOutcome>> {
  return poojaRepository.bulkDeletePoojas(ids)
}
