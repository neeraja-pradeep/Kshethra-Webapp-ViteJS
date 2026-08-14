import type { Result } from '@/core/error/result'

import type { PoojaAvailability } from '@/features/poojas/domain/entities/pooja-availability'
import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function fetchAvailability(
  id: number,
  start?: string,
  end?: string,
): Promise<Result<PoojaAvailability>> {
  return poojaRepository.fetchAvailability(id, start, end)
}
