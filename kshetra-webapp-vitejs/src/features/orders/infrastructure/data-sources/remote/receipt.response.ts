import { z } from 'zod'

import { decimal } from '@/core/api/wire'
import type { OrderReceipt, ReceiptItem } from '@/features/orders/domain/entities/pooja-receipt'
import {
  cancellationSchema,
  toOrderCancellation,
} from '@/features/orders/infrastructure/data-sources/remote/orderDetail.response'

const text = z.string().nullish()

const receiptItemSchema = z.object({
  pooja_id: z.number().nullish(),
  name: z.string(),
  god: text,
  base: decimal.nullish(),
  dates: z.array(z.string()).default([]),
  people: z.array(z.object({ name: text, nakshatram: text })).default([]),
  people_count: z.number().default(0),
  count: z.number().default(0),
  cancelled_count: z.number().default(0),
  amount: decimal,
  remarks: text,
})

/**
 * `GET admin/orders/pooja/<id>/receipt/`, for both channels — a real
 * `CounterReceipt` on a walk-in, or one composed from the order for an app
 * payment. One shape, so both render through the same template.
 */
export const receiptResponseSchema = z.object({
  receipt_no: z.string(),
  source: z.enum(['counter', 'derived']),
  issued_at: z.string(),
  order: z.object({
    id: z.number(),
    reference: z.string(),
    channel: z.enum(['app', 'counter']),
    channel_display: text,
    created_at: z.string(),
    agent_code: text,
  }),
  payer: z.object({ name: text, phone_number: text, email: text }).nullish(),
  staff_name: text,
  payment_method: text,
  payment_method_display: text,
  payment_status: z.string(),
  items: z.array(receiptItemSchema).default([]),
  pooja_count: z.number(),
  pooja_count_billed: z.number(),
  subtotal: decimal,
  additional_charges: decimal.nullish(),
  total: decimal,
  refund_amount: decimal.nullish(),
  reconciled_amount: decimal.nullish(),
  net_total: decimal,
  cancellation: cancellationSchema.nullish(),
})

export type ReceiptResponseDto = z.infer<typeof receiptResponseSchema>

function toReceiptItem(dto: z.infer<typeof receiptItemSchema>): ReceiptItem {
  return {
    poojaId: dto.pooja_id ?? null,
    name: dto.name,
    god: dto.god ?? '',
    base: dto.base ?? 0,
    dates: dto.dates,
    people: dto.people.map((person) => ({ name: person.name ?? '', nakshatram: person.nakshatram ?? '' })),
    peopleCount: dto.people_count,
    count: dto.count,
    cancelledCount: dto.cancelled_count,
    amount: dto.amount,
    remarks: dto.remarks ?? '',
  }
}

export function toOrderReceipt(dto: ReceiptResponseDto): OrderReceipt {
  return {
    receiptNo: dto.receipt_no,
    source: dto.source,
    issuedAt: dto.issued_at,
    order: {
      id: dto.order.id,
      reference: dto.order.reference,
      channel: dto.order.channel,
      channelDisplay: dto.order.channel_display ?? '',
      createdAt: dto.order.created_at,
      agentCode: dto.order.agent_code ?? null,
    },
    payer: dto.payer
      ? { name: dto.payer.name ?? '', phone: dto.payer.phone_number ?? '', email: dto.payer.email ?? '' }
      : null,
    staffName: dto.staff_name ?? '',
    paymentMethod: dto.payment_method ?? '',
    paymentMethodDisplay: dto.payment_method_display ?? '',
    paymentStatus: dto.payment_status,
    items: dto.items.map(toReceiptItem),
    poojaCount: dto.pooja_count,
    poojaCountBilled: dto.pooja_count_billed,
    subtotal: dto.subtotal,
    additionalCharges: dto.additional_charges ?? 0,
    total: dto.total,
    refundAmount: dto.refund_amount ?? 0,
    reconciledAmount: dto.reconciled_amount ?? 0,
    netTotal: dto.net_total,
    cancellation: dto.cancellation ? toOrderCancellation(dto.cancellation) : null,
  }
}
