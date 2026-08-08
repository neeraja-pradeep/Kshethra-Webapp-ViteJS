import type { Result } from '@/core/error/result'
import type { CounterReceipt } from '@/features/counter-pos/domain/entities/counter-receipt'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import { counterRepository } from '@/features/counter-pos/infrastructure/repositories/counter.repository.impl'

export function recordAgentPayment(orderId: number, method: PaymentMethod): Promise<Result<CounterReceipt>> {
  return counterRepository.recordAgentPayment(orderId, method)
}
