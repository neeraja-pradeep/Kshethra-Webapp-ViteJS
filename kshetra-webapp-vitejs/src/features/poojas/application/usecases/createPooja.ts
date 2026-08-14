import type { Result } from '@/core/error/result'

import type {
  PoojaSaveOutcome,
  PoojaWrite,
} from '@/features/poojas/domain/repositories/pooja.repository'
import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function createPooja(input: PoojaWrite): Promise<Result<PoojaSaveOutcome>> {
  return poojaRepository.createPooja(input)
}
