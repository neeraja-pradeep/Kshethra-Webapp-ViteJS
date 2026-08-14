import type { Result } from '@/core/error/result'

import type { Pooja } from '@/features/poojas/domain/entities/pooja'
import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function duplicatePooja(id: number, name?: string): Promise<Result<Pooja>> {
  return poojaRepository.duplicatePooja(id, name)
}
