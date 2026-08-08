import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'
import type { CollectionSummary } from '@/features/counter-pos/domain/entities/collection-summary'
import type { CounterReceipt } from '@/features/counter-pos/domain/entities/counter-receipt'
import type { CreateSaleInput } from '@/features/counter-pos/domain/entities/counter-sale'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import type {
  AgentBookingFilters,
  CounterRepository,
  CounterSaleFilters,
  CounterSalePage,
} from '@/features/counter-pos/domain/repositories/counter.repository'
import { toAgentBooking } from '@/features/counter-pos/infrastructure/data-sources/remote/agentBooking.response'
import { toCollectionSummary } from '@/features/counter-pos/infrastructure/data-sources/remote/collectionSummary.response'
import {
  getAgentBookings,
  getCollectionSummary,
  getCounterSale,
  getCounterSales,
  postCancelCounterSale,
  postCounterSale,
  postRecordAgentPayment,
} from '@/features/counter-pos/infrastructure/data-sources/remote/counter.api'
import {
  toCounterReceipt,
  toCounterReceiptSummary,
} from '@/features/counter-pos/infrastructure/data-sources/remote/counterReceipt.response'
import { toCreateSaleRequest } from '@/features/counter-pos/infrastructure/data-sources/remote/createSale.request'

export const counterRepository: CounterRepository = {
  async fetchSales(filters: CounterSaleFilters): Promise<Result<CounterSalePage>> {
    try {
      const page = await getCounterSales(filters)
      return ok({ count: page.count, results: page.results.map(toCounterReceiptSummary) })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createSale(input: CreateSaleInput): Promise<Result<CounterReceipt>> {
    try {
      return ok(toCounterReceipt(await postCounterSale(toCreateSaleRequest(input))))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchSale(id: number): Promise<Result<CounterReceipt>> {
    try {
      return ok(toCounterReceipt(await getCounterSale(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async cancelSale(id: number, reason: string): Promise<Result<CounterReceipt>> {
    try {
      return ok(toCounterReceipt(await postCancelCounterSale(id, reason)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchCollectionSummary(date: string): Promise<Result<CollectionSummary>> {
    try {
      return ok(toCollectionSummary(await getCollectionSummary(date)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchAgentBookings(filters: AgentBookingFilters): Promise<Result<readonly AgentBooking[]>> {
    try {
      return ok((await getAgentBookings(filters)).map(toAgentBooking))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async recordAgentPayment(orderId: number, method: PaymentMethod): Promise<Result<CounterReceipt>> {
    try {
      return ok(toCounterReceipt(await postRecordAgentPayment(orderId, method)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
