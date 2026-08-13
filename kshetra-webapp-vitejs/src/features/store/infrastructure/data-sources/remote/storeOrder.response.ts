import { z } from 'zod'

import { decimal } from '@/core/api/wire'
import {
  orderCounterSchema,
  orderCustomerSchema,
  toOrderCounter,
  toOrderCustomer,
} from '@/shared/order-feed/infrastructure/orderFeed.response'

import type {
  StoreOrderAddress,
  StoreOrderCancellation,
  StoreOrderDetail,
  StoreOrderItem,
  StoreOrderPayment,
  StoreSettlement,
} from '@/features/store/domain/entities/store-order'

const text = z.string().nullish()

export const fulfilmentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
])

export const storePaymentStatusSchema = z.enum([
  'paid',
  'pending',
  'failed',
  'cancelled',
  'refund_pending',
  'refunded',
  'partially_refunded',
])

const addressSchema = z.object({
  name: text,
  line1: text,
  line2: text,
  city: text,
  state: text,
  pincode: text,
  phone: text,
})

const itemSchema = z.object({
  id: z.number(),
  variant_id: z.number().nullish(),
  sku: text,
  name: z.string(),
  product_name: text,
  variant_name: text,
  category: text,
  image_url: text,
  quantity: z.number(),
  unit_price: decimal,
  amount: decimal,
})

const paymentSchema = z.object({
  total: decimal,
  payment_status: storePaymentStatusSchema,
  payment_method: text,
  payment_method_display: text,
  refund_status: z.enum(['none', 'pending', 'processed', 'failed']).nullish(),
  refund_amount: decimal.nullish(),
  refund_reference: text,
  refundable_amount: decimal,
  receipt: z.object({ receipt_no: z.string(), source: z.enum(['counter', 'derived']) }).nullish(),
})

const fulfilmentSchema = z.object({
  status: fulfilmentStatusSchema,
  status_display: text,
  next_statuses: z.array(fulfilmentStatusSchema).default([]),
  can_cancel: z.boolean().default(false),
})

const cancellationSchema = z.object({
  cancelled: z.boolean(),
  reason: text,
  cancelled_at: z.string().nullish(),
  cancelled_by: text,
  can_cancel: z.boolean().default(false),
  cancellable_amount: decimal.nullish(),
})

const settlementSchema = z.object({
  method: z.enum(['gateway', 'counter', 'none']),
  amount: decimal,
  reference: text,
})

/**
 * `GET admin/orders/product/<id>/`, and the same payload from fulfilment,
 * cancel and refund — the last two with `settlement`, cancel also with
 * `restocked`. That is what lets the page re-render from one response.
 */
export const storeOrderDetailSchema = z.object({
  source: z.literal('product'),
  id: z.number(),
  reference: z.string(),
  channel: z.enum(['app', 'counter']),
  channel_display: text,
  status: z.string(),
  customer: orderCustomerSchema.nullish(),
  counter: orderCounterSchema.nullish(),
  shipping_address: addressSchema.nullish(),
  billing_address: addressSchema.nullish(),
  item_count: z.number().default(0),
  distinct_item_count: z.number().default(0),
  items: z.array(itemSchema).default([]),
  payment: paymentSchema,
  fulfilment: fulfilmentSchema,
  cancellation: cancellationSchema,
  created_at: z.string().nullish(),
  settlement: settlementSchema.nullish(),
  restocked: z.boolean().nullish(),
})

export type StoreOrderDetailDto = z.infer<typeof storeOrderDetailSchema>

/** The `400` a walk-in gets when the shelf cannot cover it, per line. */
export const walkInShortfallSchema = z.object({
  detail: z.string().nullish(),
  items: z.array(
    z.object({
      product_variant: z.number(),
      name: text,
      requested: z.number(),
      available: z.number(),
    }),
  ),
})

function toAddress(dto: z.infer<typeof addressSchema> | null | undefined): StoreOrderAddress | null {
  if (!dto) return null
  return {
    name: dto.name ?? '',
    line1: dto.line1 ?? '',
    line2: dto.line2 ?? '',
    city: dto.city ?? '',
    state: dto.state ?? '',
    pincode: dto.pincode ?? '',
    phone: dto.phone ?? '',
  }
}

function toItem(dto: z.infer<typeof itemSchema>): StoreOrderItem {
  return {
    id: dto.id,
    variantId: dto.variant_id ?? null,
    sku: dto.sku ?? '',
    name: dto.name,
    productName: dto.product_name ?? '',
    variantName: dto.variant_name ?? '',
    category: dto.category ?? '',
    imageUrl: dto.image_url ?? null,
    quantity: dto.quantity,
    unitPrice: dto.unit_price,
    amount: dto.amount,
  }
}

function toPayment(dto: z.infer<typeof paymentSchema>): StoreOrderPayment {
  return {
    total: dto.total,
    paymentStatus: dto.payment_status,
    paymentMethod: dto.payment_method ?? '',
    paymentMethodDisplay: dto.payment_method_display ?? '',
    refundStatus: dto.refund_status ?? 'none',
    refundAmount: dto.refund_amount ?? 0,
    refundReference: dto.refund_reference ?? null,
    refundableAmount: dto.refundable_amount,
    receipt: dto.receipt ? { receiptNo: dto.receipt.receipt_no, source: dto.receipt.source } : null,
  }
}

export function toStoreOrderCancellation(dto: z.infer<typeof cancellationSchema>): StoreOrderCancellation {
  return {
    cancelled: dto.cancelled,
    reason: dto.reason ?? null,
    cancelledAt: dto.cancelled_at ?? null,
    cancelledBy: dto.cancelled_by ?? null,
    canCancel: dto.can_cancel,
    cancellableAmount: dto.cancellable_amount ?? 0,
  }
}

function toSettlement(dto: z.infer<typeof settlementSchema>): StoreSettlement {
  return { method: dto.method, amount: dto.amount, reference: dto.reference ?? null }
}

export function toStoreOrderDetail(dto: StoreOrderDetailDto): StoreOrderDetail {
  return {
    source: dto.source,
    id: dto.id,
    reference: dto.reference,
    channel: dto.channel,
    channelDisplay: dto.channel_display ?? '',
    status: dto.status,
    customer: dto.customer ? toOrderCustomer(dto.customer) : null,
    counter: dto.counter ? toOrderCounter(dto.counter) : null,
    shippingAddress: toAddress(dto.shipping_address),
    billingAddress: toAddress(dto.billing_address),
    itemCount: dto.item_count,
    distinctItemCount: dto.distinct_item_count,
    items: dto.items.map(toItem),
    payment: toPayment(dto.payment),
    fulfilment: {
      status: dto.fulfilment.status,
      statusDisplay: dto.fulfilment.status_display ?? '',
      nextStatuses: dto.fulfilment.next_statuses,
      canCancel: dto.fulfilment.can_cancel,
    },
    cancellation: toStoreOrderCancellation(dto.cancellation),
    createdAt: dto.created_at ?? '',
    settlement: dto.settlement ? toSettlement(dto.settlement) : null,
    restocked: dto.restocked ?? null,
  }
}
