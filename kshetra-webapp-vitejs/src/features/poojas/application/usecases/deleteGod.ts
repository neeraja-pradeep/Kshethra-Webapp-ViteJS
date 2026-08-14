import type { Result } from '@/core/error/result'

import { godRepository } from '@/features/poojas/infrastructure/repositories/god.repository.impl'

export function deleteGod(id: number): Promise<Result<void>> {
  return godRepository.deleteGod(id)
}
