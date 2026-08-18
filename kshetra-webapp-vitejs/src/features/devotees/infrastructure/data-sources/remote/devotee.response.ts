import { z } from 'zod'

import { decimal, paginated } from '@/core/api/wire'
import type {
  Devotee,
  DevoteeDetail,
  DevoteeFamilyMember,
  DevoteePoojaBooking,
  DevoteeShopOrder,
  DevoteeSummary,
} from '@/features/devotees/domain/entities/devotee'

/** A nullable string the UI renders as an em dash rather than as "null". */
const text = z.string().nullish()

export const devoteeStatusSchema = z.enum(['active', 'suspended'])

/** Wire shape of one row from `GET admin/devotees/`. */
export const devoteeResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone_number: text,
  email: text,
  family_count: z.number(),
  booking_count: z.number(),
  last_activity: z.string(),
  status: devoteeStatusSchema,
})

const devoteeFamilyResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  dob: z.string().nullable(),
  time: z.string().nullable(),
  is_self: z.boolean(),
  nakshatrams: z.array(z.string()).default([]),
})

const devoteeBookingResponseSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  pooja: text,
  date: z.string().nullable(),
  booked_for: text,
  status: z.string(),
  pooja_status: z.string(),
  price: decimal,
})

const devoteeShopOrderResponseSchema = z.object({
  id: z.number(),
  status: z.string(),
  payment_status: z.string(),
  total: decimal,
  created_at: z.string(),
})

/** `GET admin/devotees/<id>/` — the row plus the six fields behind it. */
export const devoteeDetailResponseSchema = devoteeResponseSchema.extend({
  username: z.string(),
  joined_at: z.string(),
  last_login: z.string().nullable(),
  family: z.array(devoteeFamilyResponseSchema).default([]),
  recent_bookings: z.array(devoteeBookingResponseSchema).default([]),
  recent_orders: z.array(devoteeShopOrderResponseSchema).default([]),
})

/** Counted over the whole searched set, so the tiles hold still while paging. */
export const devoteeSummaryResponseSchema = z.object({
  total: z.number(),
  active: z.number(),
  suspended: z.number(),
})

/** The screen's page shape — a standard DRF page plus `summary`. */
export const devoteePageResponseSchema = paginated(devoteeResponseSchema).extend({
  summary: devoteeSummaryResponseSchema,
})

export type DevoteeResponseDto = z.infer<typeof devoteeResponseSchema>
export type DevoteeDetailResponseDto = z.infer<typeof devoteeDetailResponseSchema>
export type DevoteePageResponseDto = z.infer<typeof devoteePageResponseSchema>
type DevoteeSummaryResponseDto = z.infer<typeof devoteeSummaryResponseSchema>

/** `nullish` covers both `null` and a missing key; the UI wants one absent value. */
function nullable(value: string | null | undefined): string | null {
  return value ?? null
}

export function toDevotee(dto: DevoteeResponseDto): Devotee {
  return {
    id: dto.id,
    name: dto.name,
    phone: nullable(dto.phone_number),
    email: nullable(dto.email),
    familyCount: dto.family_count,
    bookingCount: dto.booking_count,
    lastActivity: dto.last_activity,
    status: dto.status,
  }
}

function toFamilyMember(dto: z.infer<typeof devoteeFamilyResponseSchema>): DevoteeFamilyMember {
  return {
    id: dto.id,
    name: dto.name,
    dob: dto.dob,
    time: dto.time,
    isSelf: dto.is_self,
    nakshatrams: dto.nakshatrams,
  }
}

function toPoojaBooking(dto: z.infer<typeof devoteeBookingResponseSchema>): DevoteePoojaBooking {
  return {
    id: dto.id,
    orderId: dto.order_id,
    pooja: nullable(dto.pooja),
    date: dto.date,
    bookedFor: nullable(dto.booked_for),
    status: dto.status,
    poojaStatus: dto.pooja_status,
    price: dto.price,
  }
}

function toShopOrder(dto: z.infer<typeof devoteeShopOrderResponseSchema>): DevoteeShopOrder {
  return {
    id: dto.id,
    status: dto.status,
    paymentStatus: dto.payment_status,
    total: dto.total,
    createdAt: dto.created_at,
  }
}

export function toDevoteeDetail(dto: DevoteeDetailResponseDto): DevoteeDetail {
  return {
    ...toDevotee(dto),
    username: dto.username,
    joinedAt: dto.joined_at,
    lastLogin: dto.last_login,
    family: dto.family.map(toFamilyMember),
    recentBookings: dto.recent_bookings.map(toPoojaBooking),
    recentOrders: dto.recent_orders.map(toShopOrder),
  }
}

export function toDevoteeSummary(dto: DevoteeSummaryResponseDto): DevoteeSummary {
  return { total: dto.total, active: dto.active, suspended: dto.suspended }
}
