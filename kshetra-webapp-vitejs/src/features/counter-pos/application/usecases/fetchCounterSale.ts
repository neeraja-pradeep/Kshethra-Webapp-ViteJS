import type { Result } from '@/core/error/result'
import type { CounterReceipt } from '@/features/counter-pos/domain/entities/counter-receipt'
import { counterRepository } from '@/features/counter-pos/infrastructure/repositories/counter.repository.impl'

export function fetchCounterSale(id: number): Promise<Result<CounterReceipt>> {
  return counterRepository.fetchSale(id)
}
