import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type {
  OrderFeedRepository,
  OrderFilters,
  OrderPage,
} from '@/shared/order-feed/domain/order-feed.repository'
import { getOrders } from '@/shared/order-feed/infrastructure/orderFeed.api'
import {
  toOrderListRow,
  toOrdersSummary,
} from '@/shared/order-feed/infrastructure/orderFeed.response'

export const orderFeedRepository: OrderFeedRepository = {
  async fetchOrders(filters: OrderFilters = {}): Promise<Result<OrderPage>> {
    try {
      const page = await getOrders(filters)
      return ok({
        count: page.count,
        results: page.results.map(toOrderListRow),
        summary: toOrdersSummary(page.summary),
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
