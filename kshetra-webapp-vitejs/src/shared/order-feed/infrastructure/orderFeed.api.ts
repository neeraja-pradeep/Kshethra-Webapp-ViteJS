import { http } from '@/core/api/http'
import { ADMIN_ORDER_ENDPOINTS } from '@/core/config/endpoints'

import type { OrderFilters } from '@/shared/order-feed/domain/order-feed.repository'
import {
  orderPageResponseSchema,
  type OrderPageResponseDto,
} from '@/shared/order-feed/infrastructure/orderFeed.response'

/** Only keys the caller actually set are sent — an empty one means "no filter". */
function toParams(filters: OrderFilters): Record<string, string | number> {
  return {
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.channel ? { channel: filters.channel } : {}),
    ...(filters.paymentStatus ? { payment_status: filters.paymentStatus } : {}),
    ...(filters.poojaStatus ? { pooja_status: filters.poojaStatus } : {}),
    ...(filters.agentCode ? { agent_code: filters.agentCode } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.paymentMethod ? { payment_method: filters.paymentMethod } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.pageSize ? { page_size: filters.pageSize } : {}),
  }
}

export async function getOrders(filters: OrderFilters = {}): Promise<OrderPageResponseDto> {
  const response = await http.get(ADMIN_ORDER_ENDPOINTS.allOrders, { params: toParams(filters) })
  return orderPageResponseSchema.parse(response.data)
}
