import { z } from 'zod'

import type { CounterReceipt, CounterReceiptItem } from '@/features/counter-pos/domain/entities/counter-receipt'
import { decimal } from '@/features/counter-pos/infrastructure/data-sources/remote/wire'

const receiptPersonSchema = z.object({
  name: z.string(),
  // The server stores the nakshatra as a snapshot name, not an id, so a
  // printed receipt cannot be round-tripped back into a booking.
  nakshatram: z.string().nullable(),
})

const receiptItemSchema = z.object({
  pooja_id: z.number(),
  name: z.string(),
  god: z.string(),
  base: decimal,
  dates: z.array(z.string()),
  people: z.array(receiptPersonSchema),
  people_count: z.number(),
  count: z.number(),
  cancelled_count: z.number(),
  amount: decimal,
  remarks: z.string().nullable(),
})

export const counterReceiptResponseSchema = z.object({
  id: z.number(),
  receipt_no: z.string(),
  sale_type: z.enum(['walk_in', 'agent_booking']),
  staff_name: z.string(),
  payment_method: z.enum(['cash', 'card', 'upi', 'netbanking']),
  total: decimal,
  pooja_count: z.number(),
  customer_name: z.string().nullable(),
  customer_phone: z.string().nullable(),
  status: z.enum(['completed', 'cancelled']),
  cancel_reason: z.string().nullable(),
  created_at: z.string(),
  order_ids: z.array(z.number()),
  items: z.array(receiptItemSchema),
})

export type CounterReceiptResponseDto = z.infer<typeof counterReceiptResponseSchema>

function toItem(dto: z.infer<typeof receiptItemSchema>): CounterReceiptItem {
  return {
    poojaId: dto.pooja_id,
    name: dto.name,
    god: dto.god,
    base: dto.base,
    dates: dto.dates,
    people: dto.people.map((person) => ({ name: person.name, nakshatram: person.nakshatram ?? '' })),
    peopleCount: dto.people_count,
    count: dto.count,
    cancelledCount: dto.cancelled_count,
    amount: dto.amount,
    remarks: dto.remarks ?? '',
  }
}

export function toCounterReceipt(dto: CounterReceiptResponseDto): CounterReceipt {
  return {
    id: dto.id,
    receiptNo: dto.receipt_no,
    saleType: dto.sale_type,
    staffName: dto.staff_name,
    paymentMethod: dto.payment_method,
    total: dto.total,
    poojaCount: dto.pooja_count,
    customerName: dto.customer_name ?? '',
    customerPhone: dto.customer_phone ?? '',
    status: dto.status,
    cancelReason: dto.cancel_reason ?? '',
    createdAt: dto.created_at,
    orderIds: dto.order_ids,
    items: dto.items.map(toItem),
  }
}

/** The lighter row behind the day's transactions list — no `items`. */
export const counterReceiptListResponseSchema = z.object({
  id: z.number(),
  receipt_no: z.string(),
  sale_type: z.enum(['walk_in', 'agent_booking']),
  staff_name: z.string(),
  payment_method: z.enum(['cash', 'card', 'upi', 'netbanking']),
  total: decimal,
  pooja_count: z.number(),
  customer_name: z.string().nullable(),
  customer_phone: z.string().nullable(),
  status: z.enum(['completed', 'cancelled']),
  created_at: z.string(),
})

export type CounterReceiptListResponseDto = z.infer<typeof counterReceiptListResponseSchema>

/** A list row as a receipt with no items — enough for a table, not for printing. */
export function toCounterReceiptSummary(dto: CounterReceiptListResponseDto): CounterReceipt {
  return {
    id: dto.id,
    receiptNo: dto.receipt_no,
    saleType: dto.sale_type,
    staffName: dto.staff_name,
    paymentMethod: dto.payment_method,
    total: dto.total,
    poojaCount: dto.pooja_count,
    customerName: dto.customer_name ?? '',
    customerPhone: dto.customer_phone ?? '',
    status: dto.status,
    cancelReason: '',
    createdAt: dto.created_at,
    orderIds: [],
    items: [],
  }
}
