import { http } from '@/core/api/http'
import { countedList, paginated } from '@/core/api/wire'
import { ADMIN_BOOKING_ENDPOINTS, CATALOGUE_ENDPOINTS } from '@/core/config/endpoints'

import type { BookingFilters } from '@/features/bookings/domain/repositories/booking.repository'
import {
  bookingActionResponseSchema,
  bookingPageResponseSchema,
  type BookingPageResponseDto,
  type BookingResponseDto,
} from '@/features/bookings/infrastructure/data-sources/remote/booking.response'
import {
  godResponseSchema,
  type GodResponseDto,
} from '@/features/bookings/infrastructure/data-sources/remote/god.response'
import {
  poojariResponseSchema,
  type PoojariResponseDto,
} from '@/features/bookings/infrastructure/data-sources/remote/poojari.response'

/** Poojaris are a small fixed roster; one page covers it. */
const POOJARI_PAGE_SIZE = 100

/** Only keys the caller actually set are sent — an empty one means "no filter". */
function toParams(filters: BookingFilters): Record<string, string | number> {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    ...(filters.god ? { god: filters.god } : {}),
    ...(filters.poojaType ? { pooja_type: filters.poojaType } : {}),
    ...(filters.poojari ? { poojari: filters.poojari } : {}),
    ...(filters.channel ? { channel: filters.channel } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.sort ? { sort: filters.sort } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.pageSize ? { page_size: filters.pageSize } : {}),
  }
}

export async function getBookings(filters: BookingFilters = {}): Promise<BookingPageResponseDto> {
  const response = await http.get(ADMIN_BOOKING_ENDPOINTS.bookings, { params: toParams(filters) })
  return bookingPageResponseSchema.parse(response.data)
}

export async function getPoojaris(): Promise<readonly PoojariResponseDto[]> {
  const response = await http.get(ADMIN_BOOKING_ENDPOINTS.poojaris, { params: { page_size: POOJARI_PAGE_SIZE } })
  return paginated(poojariResponseSchema).parse(response.data).results
}

export async function postCompleteBookings(bookingIds: readonly number[]): Promise<readonly BookingResponseDto[]> {
  const response = await http.post(ADMIN_BOOKING_ENDPOINTS.completeBookings, { booking_ids: bookingIds })
  return bookingActionResponseSchema.parse(response.data).bookings
}

export async function postAssignPoojari(
  bookingIds: readonly number[],
  poojariId: number,
): Promise<readonly BookingResponseDto[]> {
  const response = await http.post(ADMIN_BOOKING_ENDPOINTS.assignBookings, {
    booking_ids: bookingIds,
    poojari: poojariId,
  })
  return bookingActionResponseSchema.parse(response.data).bookings
}

/** Gods for the filter dropdown. Active only — a retired god filters to nothing. */
export async function getGods(): Promise<readonly GodResponseDto[]> {
  const response = await http.get(CATALOGUE_ENDPOINTS.poojaCategories, { params: { is_active: 'true' } })
  return countedList(godResponseSchema).parse(response.data).results
}
