import type { Result } from '@/core/error/result'

import type { Pooja } from '@/features/poojas/domain/entities/pooja'
import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function fetchPooja(id: number): Promise<Result<Pooja>> {
  return poojaRepository.fetchPooja(id)
}
