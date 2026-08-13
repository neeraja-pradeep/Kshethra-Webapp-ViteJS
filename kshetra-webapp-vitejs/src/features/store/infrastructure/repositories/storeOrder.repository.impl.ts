import axios from 'axios'

import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'
import type { Failure } from '@/core/error/failure'

import type { FulfilmentStatus, StoreOrderDetail } from '@/features/store/domain/entities/store-order'
import type { StoreReceipt } from '@/features/store/domain/entities/store-receipt'
import type {
  StockShortfall,
  StoreOrderRepository,
  WalkInSale,
} from '@/features/store/domain/repositories/storeOrder.repository'
import {
  toStoreOrderDetail,
  walkInShortfallSchema,
} from '@/features/store/infrastructure/data-sources/remote/storeOrder.response'
import { toStoreReceipt } from '@/features/store/infrastructure/data-sources/remote/storeReceipt.response'
import {
  getStoreOrder,
  getStoreOrderReceipt,
  postCancelStoreOrder,
  postFulfilment,
  postRefundStoreOrder,
  postWalkInSale,
} from '@/features/store/infrastructure/data-sources/remote/storeOrders.api'

/** Where a rescued shortfall list is carried on the failure. */
export const SHORTFALL_DETAIL_KEY = 'shortfalls'

/**
 * Keeps the per-line stock breakdown that `mapHttpError` would otherwise lose.
 *
 * That mapper flattens an error body to strings, and its `toMessages` drops
 * numbers — so `{items:[{product_variant:18,name:"Large",requested:9,
 * available:5}]}` arrives as `fieldErrors.items === ["Large"]`, with the two
 * figures the operator actually needs gone. The rows are re-read here and
 * attached to `details`, rather than widening a mapper every feature shares.
 */
function withShortfalls(error: unknown): Failure {
  const failure = mapHttpError(error)
  if (!axios.isAxiosError(error) || error.response?.status !== 400) return failure

  const parsed = walkInShortfallSchema.safeParse(error.response.data)
  if (!parsed.success) return failure

  const shortfalls: StockShortfall[] = parsed.data.items.map((item) => ({
    productVariant: item.product_variant,
    name: item.name ?? '',
    requested: item.requested,
    available: item.available,
  }))
  return { ...failure, details: { ...(failure.kind === 'validation' ? failure.details : {}), [SHORTFALL_DETAIL_KEY]: shortfalls } }
}

/** Reads the rescued rows back off a failure, for the cart to render per line. */
export function readShortfalls(failure: Failure | null): readonly StockShortfall[] {
  if (!failure || failure.kind !== 'validation') return []
  const rows = failure.details?.[SHORTFALL_DETAIL_KEY]
  return Array.isArray(rows) ? (rows as StockShortfall[]) : []
}

export const storeOrderRepository: StoreOrderRepository = {
  async fetchStoreOrder(orderId: number): Promise<Result<StoreOrderDetail>> {
    try {
      return ok(toStoreOrderDetail(await getStoreOrder(orderId)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchStoreOrderReceipt(orderId: number): Promise<Result<StoreReceipt>> {
    try {
      return ok(toStoreReceipt(await getStoreOrderReceipt(orderId)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setFulfilmentStatus(orderId: number, status: FulfilmentStatus): Promise<Result<StoreOrderDetail>> {
    try {
      return ok(toStoreOrderDetail(await postFulfilment(orderId, status)))
    } catch (error) {
      // A refused step answers with `next_statuses`, but the caller should read
      // those off the reloaded order rather than off an error.
      return err(mapHttpError(error))
    }
  },

  async cancelStoreOrder(orderId: number, reason: string): Promise<Result<StoreOrderDetail>> {
    try {
      return ok(toStoreOrderDetail(await postCancelStoreOrder(orderId, reason)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async refundStoreOrder(orderId: number, reason: string, amount?: number): Promise<Result<StoreOrderDetail>> {
    try {
      return ok(toStoreOrderDetail(await postRefundStoreOrder(orderId, reason, amount)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createWalkInSale(sale: WalkInSale): Promise<Result<StoreOrderDetail>> {
    try {
      return ok(toStoreOrderDetail(await postWalkInSale(sale)))
    } catch (error) {
      return err(withShortfalls(error))
    }
  },
}
