import type { Result } from '@/core/error/result'
import type { CounterReceipt } from '@/features/counter-pos/domain/entities/counter-receipt'
import { counterRepository } from '@/features/counter-pos/infrastructure/repositories/counter.repository.impl'

export function cancelCounterSale(id: number, reason: string): Promise<Result<CounterReceipt>> {
  return counterRepository.cancelSale(id, reason)
}
