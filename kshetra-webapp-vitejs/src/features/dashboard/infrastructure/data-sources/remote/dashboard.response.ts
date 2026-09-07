import { z } from 'zod'

import { decimal } from '@/core/api/wire'

import type { BookingsTrendPoint, CounterCollectionPoint } from '@/features/dashboard/domain/entities/chart-series-point'
import type {
  CounterBookingsSnapshot,
  DashboardSnapshot,
  DevoteesSnapshot,
  PoojaBookingsSnapshot,
  PoojariManagementSnapshot,
  StoreOrdersSnapshot,
} from '@/features/dashboard/domain/entities/dashboard-snapshot'

/**
 * Wire shape of `GET admin/dashboard/data/`.
 *
 * `weekday` is parsed but not mapped: the charts already derive their own label
 * from `date` through `formatDashboardDate`, and rendering the server's English
 * short day would bypass the screen's locale formatting.
 */

const bookingsTrendPointSchema = z.object({
  date: z.string(),
  weekday: z.string(),
  is_today: z.boolean(),
  count: z.number(),
})

const counterCollectionPointSchema = z.object({
  date: z.string(),
  weekday: z.string(),
  is_today: z.boolean(),
  amount: decimal,
  receipts: z.number(),
})

const poojaBookingsSchema = z.object({
  today: z.number(),
  next_7_days: z.array(bookingsTrendPointSchema),
  next_7_days_total: z.number(),
  collected_this_month: decimal,
})

const counterBookingsSchema = z.object({
  collection_today: decimal,
  receipts_today: z.number(),
  poojas_booked_today: z.number(),
  last_7_days: z.array(counterCollectionPointSchema),
  collected_this_month: decimal,
})

/** All seven statuses always arrive; the defaults guard a partial payload only. */
const storeFulfilmentSchema = z.object({
  pending: z.number().default(0),
  confirmed: z.number().default(0),
  processing: z.number().default(0),
  packed: z.number().default(0),
  shipped: z.number().default(0),
  delivered: z.number().default(0),
  cancelled: z.number().default(0),
})

const storeOrdersSchema = z.object({
  window: z.number(),
  fulfilment: storeFulfilmentSchema,
  open: z.number(),
  delivered: z.number(),
  cancelled: z.number(),
})

const poojariManagementSchema = z.object({
  awaiting_completion: z.number(),
  overdue: z.number(),
})

const devoteesSchema = z.object({
  total: z.number(),
  active: z.number(),
  suspended: z.number(),
})

export const dashboardResponseSchema = z.object({
  date: z.string(),
  pooja_bookings: poojaBookingsSchema,
  counter_bookings: counterBookingsSchema,
  store_orders: storeOrdersSchema,
  poojari_management: poojariManagementSchema,
  /**
   * `null` is a permission answer, not a missing key — the server sends it
   * explicitly when the caller may not see the card. `nullish` so an older
   * build that omits the key entirely degrades to the same hidden card rather
   * than failing the whole response.
   */
  devotees: devoteesSchema.nullish(),
})

export type DashboardResponseDto = z.infer<typeof dashboardResponseSchema>

function toBookingsTrendPoint(dto: z.infer<typeof bookingsTrendPointSchema>): BookingsTrendPoint {
  return { date: dto.date, count: dto.count, isToday: dto.is_today }
}

function toCounterCollectionPoint(dto: z.infer<typeof counterCollectionPointSchema>): CounterCollectionPoint {
  return { date: dto.date, amount: dto.amount, isToday: dto.is_today }
}

function toPoojaBookings(dto: z.infer<typeof poojaBookingsSchema>): PoojaBookingsSnapshot {
  return {
    today: dto.today,
    trend: dto.next_7_days.map(toBookingsTrendPoint),
    nextSevenDaysTotal: dto.next_7_days_total,
    collectedThisMonth: dto.collected_this_month,
  }
}

function toCounterBookings(dto: z.infer<typeof counterBookingsSchema>): CounterBookingsSnapshot {
  return {
    collectionToday: dto.collection_today,
    receiptsToday: dto.receipts_today,
    poojasBookedToday: dto.poojas_booked_today,
    collections: dto.last_7_days.map(toCounterCollectionPoint),
    collectedThisMonth: dto.collected_this_month,
  }
}

function toStoreOrders(dto: z.infer<typeof storeOrdersSchema>): StoreOrdersSnapshot {
  return {
    window: dto.window,
    fulfilment: { ...dto.fulfilment },
    open: dto.open,
    delivered: dto.delivered,
    cancelled: dto.cancelled,
  }
}

function toPoojariManagement(dto: z.infer<typeof poojariManagementSchema>): PoojariManagementSnapshot {
  return { awaitingCompletion: dto.awaiting_completion, overdue: dto.overdue }
}

function toDevotees(dto: z.infer<typeof devoteesSchema>): DevoteesSnapshot {
  return { total: dto.total, active: dto.active, suspended: dto.suspended }
}

export function toDashboardSnapshot(dto: DashboardResponseDto): DashboardSnapshot {
  return {
    date: dto.date,
    poojaBookings: toPoojaBookings(dto.pooja_bookings),
    counterBookings: toCounterBookings(dto.counter_bookings),
    storeOrders: toStoreOrders(dto.store_orders),
    poojariManagement: toPoojariManagement(dto.poojari_management),
    devotees: dto.devotees ? toDevotees(dto.devotees) : null,
  }
}
