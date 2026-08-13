import { z } from 'zod'

import { decimal } from '@/core/api/wire'
import type {
  OrderBooking,
  OrderDate,
  OrderDetail,
  OrderPayment,
  OrderPoojaGroup,
  OrderPoojaInfo,
  OrderCancellation,
  OrderSettlement,
} from '@/features/orders/domain/entities/pooja-order-detail'
import {
  orderAgentCodeSchema,
  orderCounterSchema,
  orderCustomerSchema,
  orderPaymentStatusSchema,
  orderPoojaStatusSchema,
  orderRefundStatusSchema,
  toOrderCounter,
  toOrderCustomer,
} from '@/shared/order-feed/infrastructure/orderFeed.response'

const text = z.string().nullish()

const personRefSchema = z.object({ id: z.number(), name: z.string() })
const devoteeSchema = z.object({ name: text, nakshatram: text })

/** One `users[]` entry — one booking (`PoojaOrderLine`). */
const orderBookingSchema = z.object({
  order_line_id: z.number(),
  user_list: personRefSchema.nullish(),
  user_attribute: text,
  devotee: devoteeSchema,
  price: decimal,
  line_status: z.enum(['confirmed', 'cancelled', 'refunded']),
  pooja_status: orderPoojaStatusSchema,
  poojari: personRefSchema.nullish(),
  assigned_by: personRefSchema.nullish(),
  assigned_at: z.string().nullish(),
  complete_by: z.string().nullish(),
  is_overdue: z.boolean().default(false),
  completed_at: z.string().nullish(),
  cancelled_at: z.string().nullish(),
  cancel_reason: text,
})

const orderDateSchema = z.object({
  order_id: z.number(),
  order_status: z.string(),
  pooja_status: orderPoojaStatusSchema,
  order_pooja_status: orderPoojaStatusSchema,
  order_total: decimal,
  additional_charges: decimal.nullish(),
  selected_date: z.string().nullish(),
  special_pooja_date: z.string().nullish(),
  users: z.array(orderBookingSchema).default([]),
})

const poojaInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.object({ id: z.number(), name: z.string() }).nullish(),
  gods: z.array(z.object({ id: z.number(), name: z.string(), media_url: text })).default([]),
  online_price: decimal.nullish(),
  offline_price: decimal.nullish(),
  special_pooja: z.boolean().default(false),
  media_url: text,
})

const poojaGroupSchema = z.object({
  pooja: poojaInfoSchema,
  pooja_total: decimal,
  dates: z.array(orderDateSchema).default([]),
})

const paymentSchema = z.object({
  total: decimal,
  additional_charges: decimal.nullish(),
  grand_total: decimal,
  payment_status: orderPaymentStatusSchema,
  payment_method: text,
  payment_method_display: text,
  razorpay_order_id: text,
  razorpay_payment_id: text,
  refund_status: orderRefundStatusSchema.nullish(),
  refund_amount: decimal.nullish(),
  refund_reason: text,
  reconciled_amount: decimal.nullish(),
  refundable_amount: decimal,
  receipt: z.object({ receipt_no: z.string(), source: z.enum(['counter', 'derived']) }).nullish(),
})

export const cancellationSchema = z.object({
  cancelled: z.boolean(),
  reason: text,
  cancelled_at: z.string().nullish(),
  cancelled_by: text,
  can_cancel: z.boolean(),
  cancellable_amount: decimal.nullish(),
})

const settlementSchema = z.object({
  method: z.enum(['gateway', 'reconciliation', 'none']),
  amount: decimal,
  reference: text,
  booking_ids: z.array(z.number()).nullish(),
})

/**
 * `GET admin/orders/pooja/<id>/`, and the same payload again from both cancel
 * endpoints with `settlement` added — which is what lets the page re-render
 * from one response instead of refetching.
 */
export const orderDetailResponseSchema = z.object({
  source: z.literal('pooja'),
  id: z.number(),
  reference: z.string(),
  order_group_id: text,
  channel: z.enum(['app', 'counter']),
  channel_display: text,
  created_at: z.string(),
  status: z.string(),
  pooja_status: orderPoojaStatusSchema.nullish(),
  customer: orderCustomerSchema.nullish(),
  booked_by: z.object({ name: text, phone_number: text, staff_name: text }).nullish(),
  booked_for: z.array(devoteeSchema).default([]),
  agent_code: orderAgentCodeSchema.nullish(),
  counter: orderCounterSchema.nullish(),
  awaiting_counter_payment: z.boolean().default(false),
  item_count: z.number(),
  poojas: z.array(poojaGroupSchema).default([]),
  payment: paymentSchema,
  cancellation: cancellationSchema,
  settlement: settlementSchema.nullish(),
})

export type OrderDetailResponseDto = z.infer<typeof orderDetailResponseSchema>

function toBooking(dto: z.infer<typeof orderBookingSchema>): OrderBooking {
  return {
    orderLineId: dto.order_line_id,
    userList: dto.user_list ?? null,
    userAttribute: dto.user_attribute ?? null,
    devotee: { name: dto.devotee.name ?? '', nakshatram: dto.devotee.nakshatram ?? '' },
    price: dto.price,
    lineStatus: dto.line_status,
    poojaStatus: dto.pooja_status,
    poojari: dto.poojari ?? null,
    assignedBy: dto.assigned_by ?? null,
    assignedAt: dto.assigned_at ?? null,
    completeBy: dto.complete_by ?? null,
    isOverdue: dto.is_overdue,
    completedAt: dto.completed_at ?? null,
    cancelledAt: dto.cancelled_at ?? null,
    cancelReason: dto.cancel_reason ?? null,
  }
}

function toDate(dto: z.infer<typeof orderDateSchema>): OrderDate {
  return {
    orderId: dto.order_id,
    orderStatus: dto.order_status,
    poojaStatus: dto.pooja_status,
    orderPoojaStatus: dto.order_pooja_status,
    orderTotal: dto.order_total,
    additionalCharges: dto.additional_charges ?? 0,
    selectedDate: dto.selected_date ?? null,
    specialPoojaDate: dto.special_pooja_date ?? null,
    users: dto.users.map(toBooking),
  }
}

function toPoojaInfo(dto: z.infer<typeof poojaInfoSchema>): OrderPoojaInfo {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category ?? null,
    gods: dto.gods.map((god) => ({ id: god.id, name: god.name, mediaUrl: god.media_url ?? null })),
    onlinePrice: dto.online_price ?? 0,
    offlinePrice: dto.offline_price ?? 0,
    specialPooja: dto.special_pooja,
    mediaUrl: dto.media_url ?? null,
  }
}

function toPoojaGroup(dto: z.infer<typeof poojaGroupSchema>): OrderPoojaGroup {
  return { pooja: toPoojaInfo(dto.pooja), poojaTotal: dto.pooja_total, dates: dto.dates.map(toDate) }
}

function toPayment(dto: z.infer<typeof paymentSchema>): OrderPayment {
  return {
    total: dto.total,
    additionalCharges: dto.additional_charges ?? 0,
    grandTotal: dto.grand_total,
    paymentStatus: dto.payment_status,
    paymentMethod: dto.payment_method ?? '',
    paymentMethodDisplay: dto.payment_method_display ?? '',
    razorpayOrderId: dto.razorpay_order_id ?? null,
    razorpayPaymentId: dto.razorpay_payment_id ?? null,
    refundStatus: dto.refund_status ?? 'none',
    refundAmount: dto.refund_amount ?? 0,
    refundReason: dto.refund_reason ?? null,
    reconciledAmount: dto.reconciled_amount ?? 0,
    refundableAmount: dto.refundable_amount,
    receipt: dto.receipt ? { receiptNo: dto.receipt.receipt_no, source: dto.receipt.source } : null,
  }
}

export function toOrderCancellation(dto: z.infer<typeof cancellationSchema>): OrderCancellation {
  return {
    cancelled: dto.cancelled,
    reason: dto.reason ?? null,
    cancelledAt: dto.cancelled_at ?? null,
    cancelledBy: dto.cancelled_by ?? null,
    canCancel: dto.can_cancel,
    cancellableAmount: dto.cancellable_amount ?? 0,
  }
}

function toSettlement(dto: z.infer<typeof settlementSchema>): OrderSettlement {
  return {
    method: dto.method,
    amount: dto.amount,
    reference: dto.reference ?? null,
    bookingIds: dto.booking_ids ?? null,
  }
}

export function toOrderDetail(dto: OrderDetailResponseDto): OrderDetail {
  return {
    source: dto.source,
    id: dto.id,
    reference: dto.reference,
    orderGroupId: dto.order_group_id ?? null,
    channel: dto.channel,
    channelDisplay: dto.channel_display ?? '',
    createdAt: dto.created_at,
    status: dto.status,
    poojaStatus: dto.pooja_status ?? null,
    customer: dto.customer ? toOrderCustomer(dto.customer) : null,
    bookedBy: dto.booked_by
      ? {
          name: dto.booked_by.name ?? '',
          phone: dto.booked_by.phone_number ?? '',
          staffName: dto.booked_by.staff_name ?? '',
        }
      : null,
    bookedFor: dto.booked_for.map((person) => ({
      name: person.name ?? '',
      nakshatram: person.nakshatram ?? '',
    })),
    agentCode: dto.agent_code ?? null,
    counter: dto.counter ? toOrderCounter(dto.counter) : null,
    awaitingCounterPayment: dto.awaiting_counter_payment,
    itemCount: dto.item_count,
    poojas: dto.poojas.map(toPoojaGroup),
    payment: toPayment(dto.payment),
    cancellation: toOrderCancellation(dto.cancellation),
    settlement: dto.settlement ? toSettlement(dto.settlement) : null,
  }
}
