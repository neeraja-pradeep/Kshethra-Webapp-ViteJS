import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { OrderDetail, OrderPersonRef } from '@/features/orders/domain/entities/pooja-order-detail'
import type { OrderReceipt } from '@/features/orders/domain/entities/pooja-receipt'
import type { OrderRepository } from '@/features/orders/domain/repositories/order.repository'
import type { OrderFilters, OrderPage } from '@/shared/order-feed/domain/order-feed.repository'
import { toOrderDetail } from '@/features/orders/infrastructure/data-sources/remote/orderDetail.response'
import {
  getPoojaOrder,
  getPoojaOrderReceipt,
  getPoojaris,
  postAssignPoojari,
  postCancelPoojaOrder,
  postCancelPoojaOrderBookings,
  postCompleteBookings,
} from '@/features/orders/infrastructure/data-sources/remote/orders.api'
import { toOrderPoojari } from '@/features/orders/infrastructure/data-sources/remote/poojari.response'
import { orderFeedRepository } from '@/shared/order-feed/infrastructure/orderFeed.repository.impl'
import { toOrderReceipt } from '@/features/orders/infrastructure/data-sources/remote/receipt.response'

export const orderRepository: OrderRepository = {
  // The feed is shared with the store, so it is read through one place rather
  // than a second copy of the same schema and query string.
  fetchOrders(filters: OrderFilters = {}): Promise<Result<OrderPage>> {
    return orderFeedRepository.fetchOrders(filters)
  },

  async fetchPoojaOrder(orderId: number): Promise<Result<OrderDetail>> {
    try {
      return ok(toOrderDetail(await getPoojaOrder(orderId)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchPoojaOrderReceipt(orderId: number): Promise<Result<OrderReceipt>> {
    try {
      return ok(toOrderReceipt(await getPoojaOrderReceipt(orderId)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async cancelPoojaOrder(orderId: number, reason: string): Promise<Result<OrderDetail>> {
    try {
      return ok(toOrderDetail(await postCancelPoojaOrder(orderId, reason)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async cancelPoojaOrderBookings(
    orderId: number,
    orderLineIds: readonly number[],
    reason?: string,
  ): Promise<Result<OrderDetail>> {
    try {
      return ok(toOrderDetail(await postCancelPoojaOrderBookings(orderId, orderLineIds, reason)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  // The two booking-level writes answer with booking rows rather than the
  // order, so the order is reloaded instead of patched: completing the last
  // booking standing rolls the order itself up to `completed`, which the
  // action's own response does not report.
  async completeBookings(orderId: number, orderLineIds: readonly number[]): Promise<Result<OrderDetail>> {
    try {
      await postCompleteBookings(orderLineIds)
      return ok(toOrderDetail(await getPoojaOrder(orderId)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async assignPoojari(
    orderId: number,
    orderLineIds: readonly number[],
    poojariId: number,
  ): Promise<Result<OrderDetail>> {
    try {
      await postAssignPoojari(orderLineIds, poojariId)
      return ok(toOrderDetail(await getPoojaOrder(orderId)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchPoojaris(): Promise<Result<readonly OrderPersonRef[]>> {
    try {
      // Only activated accounts — the assign endpoint refuses the rest, so
      // offering them would be an error the operator could not have avoided.
      const rows = await getPoojaris()
      return ok(rows.filter((row) => row.is_activated).map(toOrderPoojari))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
