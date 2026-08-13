/**
 * The shop receipt, for either channel.
 *
 * A walk-in has a real number stamped on it (`SRCP-1042`) and is served as
 * written. An app order has none — nothing was printed at a desk — so it is
 * composed from the order and numbered from the reference (`RCP-SO-4021`),
 * which keeps it out of the counter's own series.
 */

import type { OrderChannel } from '@/shared/order-feed/domain/order-feed'
import type { StoreOrderCancellation } from '@/features/store/domain/entities/store-order'

export interface StoreReceiptItem {
  readonly name: string
  readonly sku: string
  readonly quantity: number
  readonly unitPrice: number
  readonly amount: number
}

export interface StoreReceiptPayer {
  readonly name: string
  readonly phone: string
  readonly email: string
}

export interface StoreReceipt {
  readonly receiptNo: string
  readonly source: 'counter' | 'derived'
  readonly issuedAt: string
  readonly order: {
    readonly id: number
    readonly reference: string
    readonly channel: OrderChannel
    readonly channelDisplay: string
    readonly createdAt: string
  }
  readonly payer: StoreReceiptPayer | null
  /** Only ever set on a walk-in — an app payment went to the gateway. */
  readonly staffName: string
  readonly paymentMethod: string
  readonly paymentMethodDisplay: string
  readonly paymentStatus: string
  readonly items: readonly StoreReceiptItem[]
  /** The goods. */
  readonly subtotal: number
  /** What was charged — on an app order this includes the delivery fee. */
  readonly total: number
  readonly refundAmount: number
  /** What the temple kept: charged, less everything sent back. */
  readonly netTotal: number
  readonly cancellation: StoreOrderCancellation | null
}
