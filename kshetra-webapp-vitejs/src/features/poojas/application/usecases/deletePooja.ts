import type { Result } from '@/core/error/result'

import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function deletePooja(id: number): Promise<Result<void>> {
  return poojaRepository.deletePooja(id)
}
