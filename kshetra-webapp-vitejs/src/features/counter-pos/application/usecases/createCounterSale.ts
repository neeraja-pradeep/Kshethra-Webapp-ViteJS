import type { Result } from '@/core/error/result'
import type { CounterReceipt } from '@/features/counter-pos/domain/entities/counter-receipt'
import type { CreateSaleInput } from '@/features/counter-pos/domain/entities/counter-sale'
import { counterRepository } from '@/features/counter-pos/infrastructure/repositories/counter.repository.impl'

export function createCounterSale(input: CreateSaleInput): Promise<Result<CounterReceipt>> {
  return counterRepository.createSale(input)
}
