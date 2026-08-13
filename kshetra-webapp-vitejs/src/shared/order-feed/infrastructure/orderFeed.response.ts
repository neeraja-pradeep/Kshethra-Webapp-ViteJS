import { z } from 'zod'

import { decimal } from '@/core/api/wire'
import type {
  OrderCounter,
  OrderCustomer,
  OrderListRow,
  OrderPaymentStatus,
  OrdersSummary,
} from '@/shared/order-feed/domain/order-feed'

/** A nullable string the UI would rather render as `''` than as "null". */
const text = z.string().nullish()

export const orderPaymentStatusSchema = z.enum([
  'paid',
  'pending',
  'awaiting_counter_payment',
  'failed',
  'cancelled',
  'refund_pending',
  'refunded',
  'partially_refunded',
])

export const orderPoojaStatusSchema = z.enum(['pending', 'completed', 'cancelled'])
export const orderRefundStatusSchema = z.enum(['none', 'pending', 'processed', 'failed'])

export const orderCustomerSchema = z.object({
  id: z.number().nullable(),
  name: text,
  email: text,
  phone_number: text,
})

export const orderCounterSchema = z.object({
  /**
   * Null on a shop walk-in: the receipt number is stamped on the order itself
   * (`SRCP-1001`) rather than pointing at a separate `CounterReceipt` row, as a
   * pooja counter sale does. Verified against the running API — the field
   * reference implies it is always present, and it is not.
   */
  receipt_id: z.number().nullish(),
  receipt_no: z.string(),
  sale_type: z.string(),
  payment_method: text,
  status: z.string(),
  staff_name: text,
})

export const orderAgentCodeSchema = z.object({ id: z.number(), name: z.string() })

/**
 * Wire shape of one row from `GET admin/orders/all/`.
 *
 * `refund_status`, `refund_amount` and `order_group_id` are defaulted rather
 * than required: the server omits them on rows that never had a refund, and a
 * missing key there is not a contract break.
 */
export const orderListRowSchema = z.object({
  source: z.enum(['pooja', 'product']),
  id: z.number(),
  reference: z.string(),
  order_group_id: text,
  channel: z.enum(['app', 'counter']),
  customer: orderCustomerSchema.nullish(),
  status: z.string(),
  pooja_status: orderPoojaStatusSchema.nullish(),
  payment_status: orderPaymentStatusSchema,
  payment_method: text,
  total: decimal,
  refund_status: orderRefundStatusSchema.nullish(),
  refund_amount: decimal.nullish(),
  item_count: z.number(),
  distinct_item_count: z.number(),
  agent_code: orderAgentCodeSchema.nullish(),
  items: z.array(z.object({ name: z.string(), quantity: z.number(), amount: decimal })).default([]),
  counter: orderCounterSchema.nullish(),
  created_at: z.string(),
})

/**
 * Counted over the whole filtered set, so the tiles hold still while paging.
 *
 * `by_payment_status` is keyed loosely on purpose — the server omits statuses
 * with no orders, and an enum key in zod v4 would demand every one of them.
 */
export const ordersSummaryResponseSchema = z.object({
  total: z.number(),
  amount: decimal,
  refunds: z.object({ count: z.number(), amount: decimal }),
  by_payment_status: z.record(z.string(), z.number()).default({}),
})

/** The feed's page shape — a standard DRF page plus `summary`. */
export const orderPageResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(orderListRowSchema),
  summary: ordersSummaryResponseSchema,
})

export type OrderListRowDto = z.infer<typeof orderListRowSchema>
export type OrderPageResponseDto = z.infer<typeof orderPageResponseSchema>
export type OrdersSummaryDto = z.infer<typeof ordersSummaryResponseSchema>

export function toOrderCustomer(dto: z.infer<typeof orderCustomerSchema>): OrderCustomer {
  return {
    id: dto.id,
    name: dto.name ?? '',
    email: dto.email ?? '',
    phone: dto.phone_number ?? '',
  }
}

export function toOrderCounter(dto: z.infer<typeof orderCounterSchema>): OrderCounter {
  return {
    receiptId: dto.receipt_id ?? null,
    receiptNo: dto.receipt_no,
    saleType: dto.sale_type,
    paymentMethod: dto.payment_method ?? '',
    status: dto.status,
    staffName: dto.staff_name ?? '',
  }
}

export function toOrderListRow(dto: OrderListRowDto): OrderListRow {
  return {
    source: dto.source,
    id: dto.id,
    reference: dto.reference,
    orderGroupId: dto.order_group_id ?? null,
    channel: dto.channel,
    customer: dto.customer ? toOrderCustomer(dto.customer) : null,
    status: dto.status,
    poojaStatus: dto.pooja_status ?? null,
    paymentStatus: dto.payment_status,
    paymentMethod: dto.payment_method ?? '',
    total: dto.total,
    refundStatus: dto.refund_status ?? 'none',
    refundAmount: dto.refund_amount ?? 0,
    itemCount: dto.item_count,
    distinctItemCount: dto.distinct_item_count,
    agentCode: dto.agent_code ?? null,
    items: dto.items,
    counter: dto.counter ? toOrderCounter(dto.counter) : null,
    createdAt: dto.created_at,
  }
}

/** Drops any status the client does not know, rather than widening the union. */
export function toOrdersSummary(dto: OrdersSummaryDto): OrdersSummary {
  const known = new Set<string>(orderPaymentStatusSchema.options)
  const byPaymentStatus: Partial<Record<OrderPaymentStatus, number>> = {}
  for (const [key, count] of Object.entries(dto.by_payment_status)) {
    if (known.has(key)) byPaymentStatus[key as OrderPaymentStatus] = count
  }
  return {
    total: dto.total,
    amount: dto.amount,
    refunds: { count: dto.refunds.count, amount: dto.refunds.amount },
    byPaymentStatus,
  }
}
