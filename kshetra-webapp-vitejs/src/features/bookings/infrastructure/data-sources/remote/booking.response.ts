import { z } from 'zod'

import { decimal } from '@/core/api/wire'
import type { Booking, BookingSummary } from '@/features/bookings/domain/entities/booking'

/** A nullable string the UI would rather render as `''` than as "null". */
const text = z.string().nullish()

const poojariSchema = z.object({ id: z.number(), name: z.string() })

/** Wire shape of one row from `GET admin/bookings/all/`. */
export const bookingResponseSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  order_reference: z.string(),
  channel: z.enum(['counter', 'app']),
  booked_by: z.object({ name: text, phone_number: text, staff_name: text }),
  pooja: z.object({
    id: z.number(),
    name: z.string(),
    special_pooja: z.boolean(),
    gods: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
  }),
  pooja_date: z.string().nullable(),
  pooja_time: z.string().nullable(),
  person: z.object({ name: text, nakshatram: text }),
  poojari: poojariSchema.nullable(),
  booking_status: z.enum(['pending', 'completed', 'cancelled']),
  line_status: z.enum(['confirmed', 'cancelled', 'refunded']),
  assigned_at: z.string().nullable(),
  complete_by: z.string().nullable(),
  completed_at: z.string().nullable(),
  is_overdue: z.boolean(),
  price: decimal,
  remarks: text,
  order: z.object({
    receipt_no: text,
    total: decimal,
    payment_status: z.string(),
    payment_method: text,
    refund_status: text,
    refund_amount: decimal,
  }),
  created_at: z.string(),
})

/** Counted over the whole filtered set, so the tiles hold still while paging. */
export const bookingSummaryResponseSchema = z.object({
  total: z.number(),
  pending: z.number(),
  completed: z.number(),
  cancelled: z.number(),
})

/** The feed's page shape — a standard DRF page plus `summary`. */
export const bookingPageResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(bookingResponseSchema),
  summary: bookingSummaryResponseSchema,
})

/** The two write endpoints answer with the rows they changed. */
export const bookingActionResponseSchema = z.object({
  bookings: z.array(bookingResponseSchema),
})

export type BookingResponseDto = z.infer<typeof bookingResponseSchema>
export type BookingPageResponseDto = z.infer<typeof bookingPageResponseSchema>

export function toBooking(dto: BookingResponseDto): Booking {
  return {
    id: dto.id,
    orderId: dto.order_id,
    orderReference: dto.order_reference,
    channel: dto.channel,
    bookedBy: {
      name: dto.booked_by.name ?? '',
      phone: dto.booked_by.phone_number ?? '',
      staffName: dto.booked_by.staff_name ?? '',
    },
    pooja: {
      id: dto.pooja.id,
      name: dto.pooja.name,
      special: dto.pooja.special_pooja,
      godNames: dto.pooja.gods.map((god) => god.name),
    },
    poojaDate: dto.pooja_date,
    poojaTime: dto.pooja_time,
    person: { name: dto.person.name ?? '', nakshatram: dto.person.nakshatram ?? '' },
    poojari: dto.poojari,
    status: dto.booking_status,
    lineStatus: dto.line_status,
    isOverdue: dto.is_overdue,
    completeBy: dto.complete_by,
    completedAt: dto.completed_at,
    assignedAt: dto.assigned_at,
    price: dto.price,
    remarks: dto.remarks ?? '',
    order: {
      receiptNo: dto.order.receipt_no ?? '',
      total: dto.order.total,
      paymentStatus: dto.order.payment_status,
      paymentMethod: dto.order.payment_method ?? '',
      refundStatus: dto.order.refund_status ?? '',
      refundAmount: dto.order.refund_amount,
    },
    createdAt: dto.created_at,
  }
}

export function toBookingSummary(dto: z.infer<typeof bookingSummaryResponseSchema>): BookingSummary {
  return { total: dto.total, pending: dto.pending, completed: dto.completed, cancelled: dto.cancelled }
}
