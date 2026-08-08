import { http } from '@/core/api/http'
import { COUNTER_ENDPOINTS } from '@/core/config/endpoints'

import {
  agentBookingResponseSchema,
  type AgentBookingResponseDto,
} from '@/features/counter-pos/infrastructure/data-sources/remote/agentBooking.response'
import {
  collectionSummaryResponseSchema,
  type CollectionSummaryResponseDto,
} from '@/features/counter-pos/infrastructure/data-sources/remote/collectionSummary.response'
import {
  counterReceiptListResponseSchema,
  counterReceiptResponseSchema,
  type CounterReceiptListResponseDto,
  type CounterReceiptResponseDto,
} from '@/features/counter-pos/infrastructure/data-sources/remote/counterReceipt.response'
import type { CreateSaleRequestDto } from '@/features/counter-pos/infrastructure/data-sources/remote/createSale.request'
import { paginated } from '@/features/counter-pos/infrastructure/data-sources/remote/wire'

/** Filters for the "Counter payments" list. */
export interface AgentBookingQuery {
  readonly search?: string
  /** `true` = collected only, `false` = outstanding only, omit = both. */
  readonly paid?: boolean
  readonly page?: number
}

export async function postCounterSale(body: CreateSaleRequestDto): Promise<CounterReceiptResponseDto> {
  const response = await http.post(COUNTER_ENDPOINTS.sales, body)
  return counterReceiptResponseSchema.parse(response.data)
}

/** Filters for the day's transactions list. */
export interface CounterSaleQuery {
  /** ISO `yyyy-mm-dd`. Anything else is a `400`. */
  readonly date: string
  readonly search?: string
  readonly saleType?: 'walk_in' | 'agent_booking'
  readonly page?: number
  readonly pageSize?: number
}

export interface CounterSalePage {
  readonly count: number
  readonly results: readonly CounterReceiptListResponseDto[]
}

/** Rows are the lighter list shape — no `items`. Cancelled receipts are included. */
export async function getCounterSales(query: CounterSaleQuery): Promise<CounterSalePage> {
  const response = await http.get(COUNTER_ENDPOINTS.sales, {
    params: {
      date: query.date,
      ...(query.search ? { search: query.search } : {}),
      ...(query.saleType ? { sale_type: query.saleType } : {}),
      ...(query.page ? { page: query.page } : {}),
      ...(query.pageSize ? { page_size: query.pageSize } : {}),
    },
  })
  const page = paginated(counterReceiptListResponseSchema).parse(response.data)
  return { count: page.count, results: page.results }
}

export async function getCounterSale(id: number): Promise<CounterReceiptResponseDto> {
  const response = await http.get(COUNTER_ENDPOINTS.sale(id))
  return counterReceiptResponseSchema.parse(response.data)
}

export async function postCancelCounterSale(id: number, reason: string): Promise<CounterReceiptResponseDto> {
  const response = await http.post(COUNTER_ENDPOINTS.cancelSale(id), { reason })
  return counterReceiptResponseSchema.parse(response.data)
}

/**
 * `date` is filtered on the server's local day, with no timezone parameter —
 * a browser in another timezone will disagree about what "today" means.
 */
export async function getCollectionSummary(date: string): Promise<CollectionSummaryResponseDto> {
  const response = await http.get(COUNTER_ENDPOINTS.collectionSummary, { params: { date } })
  return collectionSummaryResponseSchema.parse(response.data)
}

export async function getAgentBookings(query: AgentBookingQuery): Promise<readonly AgentBookingResponseDto[]> {
  const response = await http.get(COUNTER_ENDPOINTS.agentBookings, {
    params: {
      ...(query.search ? { search: query.search } : {}),
      ...(query.paid === undefined ? {} : { paid: String(query.paid) }),
      ...(query.page ? { page: query.page } : {}),
    },
  })
  return paginated(agentBookingResponseSchema).parse(response.data).results
}

/**
 * Settles the whole order group in one receipt. There is no amount field —
 * the server sums it from the orders, so it cannot be under-collected.
 */
export async function postRecordAgentPayment(orderId: number, paymentMethod: string): Promise<CounterReceiptResponseDto> {
  const response = await http.post(COUNTER_ENDPOINTS.recordAgentPayment(orderId), { payment_method: paymentMethod })
  return counterReceiptResponseSchema.parse(response.data)
}
