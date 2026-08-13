import { z } from 'zod'

import { decimal } from '@/core/api/wire'
import type { StoreReceipt, StoreReceiptItem } from '@/features/store/domain/entities/store-receipt'
import {
  toStoreOrderCancellation,
} from '@/features/store/infrastructure/data-sources/remote/storeOrder.response'

const text = z.string().nullish()

const receiptItemSchema = z.object({
  name: z.string(),
  sku: text,
  quantity: z.number().default(0),
  unit_price: decimal.nullish(),
  amount: decimal,
})

const cancellationSchema = z.object({
  cancelled: z.boolean(),
  reason: text,
  cancelled_at: z.string().nullish(),
  cancelled_by: text,
  can_cancel: z.boolean().default(false),
  cancellable_amount: decimal.nullish(),
})

/**
 * `GET admin/orders/product/<id>/receipt/`. The doc describes this one in prose
 * rather than a captured example, so every field that is not load-bearing is
 * optional — a missing extra should not fail the whole receipt.
 */
export const storeReceiptSchema = z.object({
  receipt_no: z.string(),
  source: z.enum(['counter', 'derived']),
  issued_at: z.string().nullish(),
  order: z.object({
    id: z.number(),
    reference: z.string(),
    channel: z.enum(['app', 'counter']),
    channel_display: text,
    created_at: z.string().nullish(),
  }),
  /**
   * The running API names this `buyer`; the doc's prose calls it the payer.
   * Both are read so a rename on either side cannot blank the receipt header.
   */
  buyer: z.object({ name: text, phone_number: text, email: text }).nullish(),
  payer: z.object({ name: text, phone_number: text, email: text }).nullish(),
  staff_name: text,
  payment_method: text,
  payment_method_display: text,
  payment_status: z.string(),
  items: z.array(receiptItemSchema).default([]),
  subtotal: decimal,
  total: decimal,
  refund_amount: decimal.nullish(),
  net_total: decimal,
  cancellation: cancellationSchema.nullish(),
})

export type StoreReceiptDto = z.infer<typeof storeReceiptSchema>

function toItem(dto: z.infer<typeof receiptItemSchema>): StoreReceiptItem {
  return {
    name: dto.name,
    sku: dto.sku ?? '',
    quantity: dto.quantity,
    unitPrice: dto.unit_price ?? 0,
    amount: dto.amount,
  }
}

export function toStoreReceipt(dto: StoreReceiptDto): StoreReceipt {
  const person = dto.buyer ?? dto.payer
  return {
    receiptNo: dto.receipt_no,
    source: dto.source,
    issuedAt: dto.issued_at ?? '',
    order: {
      id: dto.order.id,
      reference: dto.order.reference,
      channel: dto.order.channel,
      channelDisplay: dto.order.channel_display ?? '',
      createdAt: dto.order.created_at ?? '',
    },
    payer: person
      ? { name: person.name ?? '', phone: person.phone_number ?? '', email: person.email ?? '' }
      : null,
    staffName: dto.staff_name ?? '',
    paymentMethod: dto.payment_method ?? '',
    paymentMethodDisplay: dto.payment_method_display ?? '',
    paymentStatus: dto.payment_status,
    items: dto.items.map(toItem),
    subtotal: dto.subtotal,
    total: dto.total,
    refundAmount: dto.refund_amount ?? 0,
    netTotal: dto.net_total,
    cancellation: dto.cancellation ? toStoreOrderCancellation(dto.cancellation) : null,
  }
}
