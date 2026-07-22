import type { Order, OrderChannel, OrderPaymentStatus, OrderRecordStatus } from '@/features/orders/domain/entities/order'
import { orderBookingStatus, orderDate, orderPoojaCount, orderSearchHay, orderTotal } from '@/features/orders/presentation/lib/orderRollup'

/** One flattened, sortable/filterable table row derived from an Order. */
export interface OrderRow {
  readonly id: string
  readonly ref: string
  readonly devoteeName: string
  readonly agentCode: string | null
  readonly channel: OrderChannel
  readonly counterStaff: string | null
  readonly date: string
  readonly poojaCount: number
  readonly total: number
  readonly paymentStatus: OrderPaymentStatus
  readonly paymentMethod: string
  readonly bookingStatus: OrderRecordStatus
  readonly searchHay: string
}

export function toOrderRow(order: Order): OrderRow {
  return {
    id: order.id,
    ref: order.ref,
    devoteeName: order.devoteeName,
    agentCode: order.agentCode,
    channel: order.channel,
    counterStaff: order.counterStaff,
    date: orderDate(order),
    poojaCount: orderPoojaCount(order),
    total: orderTotal(order),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    bookingStatus: orderBookingStatus(order),
    searchHay: orderSearchHay(order),
  }
}
