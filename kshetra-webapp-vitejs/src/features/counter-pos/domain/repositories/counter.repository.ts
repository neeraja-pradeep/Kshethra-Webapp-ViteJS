import type { Result } from '@/core/error/result'
import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'
import type { CollectionSummary } from '@/features/counter-pos/domain/entities/collection-summary'
import type { CounterReceipt } from '@/features/counter-pos/domain/entities/counter-receipt'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import type { CreateSaleInput } from '@/features/counter-pos/domain/entities/counter-sale'

export interface AgentBookingFilters {
  readonly search?: string
  readonly paid?: boolean
  readonly page?: number
}

export interface CounterSaleFilters {
  /** ISO `yyyy-mm-dd`. */
  readonly date: string
  readonly search?: string
  readonly saleType?: 'walk_in' | 'agent_booking'
  readonly page?: number
  readonly pageSize?: number
}

/** One page of the day's transactions. Rows carry no `items`. */
export interface CounterSalePage {
  readonly count: number
  readonly results: readonly CounterReceipt[]
}

export interface CounterRepository {
  fetchSales(filters: CounterSaleFilters): Promise<Result<CounterSalePage>>
  /** Takes a walk-in sale. The returned receipt is the authoritative record. */
  createSale(input: CreateSaleInput): Promise<Result<CounterReceipt>>
  fetchSale(id: number): Promise<Result<CounterReceipt>>
  cancelSale(id: number, reason: string): Promise<Result<CounterReceipt>>
  /** @param date ISO `yyyy-mm-dd`. */
  fetchCollectionSummary(date: string): Promise<Result<CollectionSummary>>
  fetchAgentBookings(filters: AgentBookingFilters): Promise<Result<readonly AgentBooking[]>>
  recordAgentPayment(orderId: number, method: PaymentMethod): Promise<Result<CounterReceipt>>
}
