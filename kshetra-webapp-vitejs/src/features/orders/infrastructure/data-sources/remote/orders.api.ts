import { http } from '@/core/api/http'
import { paginated } from '@/core/api/wire'
import { ADMIN_BOOKING_ENDPOINTS, ADMIN_ORDER_ENDPOINTS } from '@/core/config/endpoints'

import {
  orderDetailResponseSchema,
  type OrderDetailResponseDto,
} from '@/features/orders/infrastructure/data-sources/remote/orderDetail.response'
import {
  poojariResponseSchema,
  type PoojariResponseDto,
} from '@/features/orders/infrastructure/data-sources/remote/poojari.response'
import {
  receiptResponseSchema,
  type ReceiptResponseDto,
} from '@/features/orders/infrastructure/data-sources/remote/receipt.response'

export async function getPoojaOrder(orderId: number): Promise<OrderDetailResponseDto> {
  const response = await http.get(ADMIN_ORDER_ENDPOINTS.poojaOrder(orderId))
  return orderDetailResponseSchema.parse(response.data)
}

export async function getPoojaOrderReceipt(orderId: number): Promise<ReceiptResponseDto> {
  const response = await http.get(ADMIN_ORDER_ENDPOINTS.poojaOrderReceipt(orderId))
  return receiptResponseSchema.parse(response.data)
}

/** Both cancels answer with the whole detail payload, `settlement` filled in. */
export async function postCancelPoojaOrder(orderId: number, reason: string): Promise<OrderDetailResponseDto> {
  const response = await http.post(ADMIN_ORDER_ENDPOINTS.cancelPoojaOrder(orderId), { reason })
  return orderDetailResponseSchema.parse(response.data)
}

export async function postCancelPoojaOrderBookings(
  orderId: number,
  bookingIds: readonly number[],
  reason?: string,
): Promise<OrderDetailResponseDto> {
  const response = await http.post(ADMIN_ORDER_ENDPOINTS.cancelPoojaOrderBookings(orderId), {
    booking_ids: bookingIds,
    ...(reason ? { reason } : {}),
  })
  return orderDetailResponseSchema.parse(response.data)
}

/**
 * Completing and assigning are booking-level actions, so they go to the
 * bookings endpoints even when the order detail page is what triggered them.
 *
 * Their responses carry booking rows, which are the `bookings` feature's shape
 * — and feature modules must not import each other. The rows are ignored here
 * and the caller refetches the order instead, which it needs to do anyway:
 * completing the last booking rolls the whole order up to `completed`.
 */
export async function postCompleteBookings(bookingIds: readonly number[]): Promise<void> {
  await http.post(ADMIN_BOOKING_ENDPOINTS.completeBookings, { booking_ids: bookingIds })
}

export async function postAssignPoojari(bookingIds: readonly number[], poojariId: number): Promise<void> {
  await http.post(ADMIN_BOOKING_ENDPOINTS.assignBookings, { booking_ids: bookingIds, poojari: poojariId })
}

/** The assign dropdown's roster. A small fixed set, so one page covers it. */
const POOJARI_PAGE_SIZE = 100

export async function getPoojaris(): Promise<readonly PoojariResponseDto[]> {
  const response = await http.get(ADMIN_BOOKING_ENDPOINTS.poojaris, { params: { page_size: POOJARI_PAGE_SIZE } })
  return paginated(poojariResponseSchema).parse(response.data).results
}
