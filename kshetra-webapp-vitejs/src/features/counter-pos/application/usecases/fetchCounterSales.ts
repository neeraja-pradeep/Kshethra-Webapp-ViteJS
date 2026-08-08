import type { Result } from '@/core/error/result'
import type { CounterSaleFilters, CounterSalePage } from '@/features/counter-pos/domain/repositories/counter.repository'
import { counterRepository } from '@/features/counter-pos/infrastructure/repositories/counter.repository.impl'

export function fetchCounterSales(filters: CounterSaleFilters): Promise<Result<CounterSalePage>> {
  return counterRepository.fetchSales(filters)
}
