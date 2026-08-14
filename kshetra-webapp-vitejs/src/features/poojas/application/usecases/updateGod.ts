import type { Result } from '@/core/error/result'

import type { God } from '@/features/poojas/domain/entities/god'
import type { GodWrite } from '@/features/poojas/domain/repositories/god.repository'
import { godRepository } from '@/features/poojas/infrastructure/repositories/god.repository.impl'

export function updateGod(id: number, input: Partial<GodWrite>): Promise<Result<God>> {
  return godRepository.updateGod(id, input)
}
