import type { Result } from '@/core/error/result'
import type {
  FulfilmentStatus,
  StoreOrderDetail,
  WalkInPaymentMethod,
} from '@/features/store/domain/entities/store-order'
import type { StoreReceipt } from '@/features/store/domain/entities/store-receipt'

/** One line of a walk-in sale. Keyed by **variant**, which is what is sold. */
export interface WalkInItem {
  readonly productVariant: number
  readonly quantity: number
}

export interface WalkInSale {
  readonly customerName?: string
  readonly customerPhone?: string
  readonly paymentMethod: WalkInPaymentMethod
  /** One line per variant — listing the same one twice is a `400`. */
  readonly items: readonly WalkInItem[]
}

/** A per-line shortfall from a refused walk-in, so the cart can say which line. */
export interface StockShortfall {
  readonly productVariant: number
  readonly name: string
  readonly requested: number
  readonly available: number
}

export interface StoreOrderRepository {
  fetchStoreOrder(orderId: number): Promise<Result<StoreOrderDetail>>
  fetchStoreOrderReceipt(orderId: number): Promise<Result<StoreReceipt>>
  /**
   * Moves the order one step along. The server refuses a step that does not
   * follow the current one, so the caller should offer only
   * `fulfilment.nextStatuses` rather than encode the flow.
   *
   * `cancelled` is **not** accepted here — it moves money, so it goes to
   * `cancelStoreOrder`.
   */
  setFulfilmentStatus(orderId: number, status: FulfilmentStatus): Promise<Result<StoreOrderDetail>>
  /**
   * Calls the order off and settles the money the one way that fits how it was
   * taken — before writing anything, so a refund the provider refuses leaves
   * the order exactly as it was. Stock goes back for anything unshipped.
   * `reason` is required.
   */
  cancelStoreOrder(orderId: number, reason: string): Promise<Result<StoreOrderDetail>>
  /**
   * Sends money back **without** calling the order off — for a damaged item on
   * an order that was otherwise delivered fine.
   *
   * Refunds accumulate and cap at `payment.refundableAmount`. Omit `amount` to
   * send back the whole remainder.
   */
  refundStoreOrder(orderId: number, reason: string, amount?: number): Promise<Result<StoreOrderDetail>>
  /**
   * Takes a walk-in sale. One transaction: the order, its lines and the stock
   * coming off the shelf land together or not at all.
   *
   * Stock is checked against what is actually sellable, with live app
   * reservations counted out — so this can refuse, and the refusal names each
   * shortfall.
   */
  createWalkInSale(sale: WalkInSale): Promise<Result<StoreOrderDetail>>
}
