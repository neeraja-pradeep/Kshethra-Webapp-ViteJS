/**
 * The printable receipt, served for **both** channels.
 *
 * A counter walk-in has a real `CounterReceipt` on file and is served as it was
 * written (`source: 'counter'`). An app order has none — nothing was printed at
 * a desk — so the receipt is composed from the order, which holds the same
 * facts (`source: 'derived'`). A derived receipt is numbered from the order
 * reference (`RCP-PO-2071`), which keeps it out of the counter's own `RCP-1042`
 * series so the two can never collide.
 *
 * `items` is grouped exactly the way the counter prints it, so both kinds
 * render through one template.
 */

import type { OrderChannel } from '@/shared/order-feed/domain/order-feed'
import type { OrderCancellation, OrderDevotee } from '@/features/orders/domain/entities/pooja-order-detail'

export interface ReceiptOrderRef {
  readonly id: number
  readonly reference: string
  readonly channel: OrderChannel
  readonly channelDisplay: string
  readonly createdAt: string
  readonly agentCode: string | null
}

export interface ReceiptPayer {
  readonly name: string
  readonly phone: string
  readonly email: string
}

export interface ReceiptItem {
  readonly poojaId: number | null
  readonly name: string
  readonly god: string
  /** Unit price the line was billed at. */
  readonly base: number
  readonly dates: readonly string[]
  readonly people: readonly OrderDevotee[]
  readonly peopleCount: number
  /** Bookings on this line. */
  readonly count: number
  /** Cancelled dates stay in `items` and are counted here. */
  readonly cancelledCount: number
  readonly amount: number
  readonly remarks: string
}

export interface OrderReceipt {
  readonly receiptNo: string
  readonly source: 'counter' | 'derived'
  readonly issuedAt: string
  readonly order: ReceiptOrderRef
  readonly payer: ReceiptPayer | null
  /** Only ever set on a counter sale — an app payment went to the gateway. */
  readonly staffName: string
  readonly paymentMethod: string
  readonly paymentMethodDisplay: string
  readonly paymentStatus: string
  readonly items: readonly ReceiptItem[]
  /** Bookings still standing. */
  readonly poojaCount: number
  /** Bookings the receipt was paid for. */
  readonly poojaCountBilled: number
  readonly subtotal: number
  readonly additionalCharges: number
  /** `subtotal + additionalCharges`. What the devotee was charged. */
  readonly total: number
  readonly refundAmount: number
  readonly reconciledAmount: number
  /** `total − refundAmount − reconciledAmount`. What the temple has kept. */
  readonly netTotal: number
  readonly cancellation: OrderCancellation | null
}
