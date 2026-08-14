import type { Result } from '@/core/error/result'

import type { PoojaImportOutcome } from '@/features/poojas/domain/repositories/pooja.repository'
import { poojaRepository } from '@/features/poojas/infrastructure/repositories/pooja.repository.impl'

export function importPoojas(file: File): Promise<Result<PoojaImportOutcome>> {
  return poojaRepository.importPoojas(file)
}
