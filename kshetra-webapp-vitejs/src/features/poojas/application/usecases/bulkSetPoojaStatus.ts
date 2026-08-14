import type { Result } from '@/core/error/result'

import type { PoojaStatus } from '@/features/poojas/domain/entities/pooja'
import type { BulkStatusOutcome } from '@/features/poojas/domain/repositories/pooja.repository'
import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function bulkSetPoojaStatus(
  ids: readonly number[],
  status: PoojaStatus,
): Promise<Result<BulkStatusOutcome>> {
  return poojaRepository.bulkSetPoojaStatus(ids, status)
}
