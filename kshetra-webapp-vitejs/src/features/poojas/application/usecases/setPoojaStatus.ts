import type { Result } from '@/core/error/result'

import type { Pooja, PoojaStatus } from '@/features/poojas/domain/entities/pooja'
import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function setPoojaStatus(id: number, status: PoojaStatus): Promise<Result<Pooja>> {
  return poojaRepository.setPoojaStatus(id, status)
}
