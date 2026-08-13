import { http } from '@/core/api/http'
import { ADMIN_ORDER_ENDPOINTS } from '@/core/config/endpoints'

import type { FulfilmentStatus } from '@/features/store/domain/entities/store-order'
import type { WalkInSale } from '@/features/store/domain/repositories/storeOrder.repository'
import {
  storeOrderDetailSchema,
  type StoreOrderDetailDto,
} from '@/features/store/infrastructure/data-sources/remote/storeOrder.response'
import {
  storeReceiptSchema,
  type StoreReceiptDto,
} from '@/features/store/infrastructure/data-sources/remote/storeReceipt.response'

export async function getStoreOrder(orderId: number): Promise<StoreOrderDetailDto> {
  const response = await http.get(ADMIN_ORDER_ENDPOINTS.productOrder(orderId))
  return storeOrderDetailSchema.parse(response.data)
}

export async function getStoreOrderReceipt(orderId: number): Promise<StoreReceiptDto> {
  const response = await http.get(ADMIN_ORDER_ENDPOINTS.productOrderReceipt(orderId))
  return storeReceiptSchema.parse(response.data)
}

export async function postFulfilment(
  orderId: number,
  status: FulfilmentStatus,
): Promise<StoreOrderDetailDto> {
  const response = await http.post(ADMIN_ORDER_ENDPOINTS.productOrderFulfilment(orderId), { status })
  return storeOrderDetailSchema.parse(response.data)
}

export async function postCancelStoreOrder(orderId: number, reason: string): Promise<StoreOrderDetailDto> {
  const response = await http.post(ADMIN_ORDER_ENDPOINTS.cancelProductOrder(orderId), { reason })
  return storeOrderDetailSchema.parse(response.data)
}

/** Omitting `amount` sends back the whole remainder. */
export async function postRefundStoreOrder(
  orderId: number,
  reason: string,
  amount?: number,
): Promise<StoreOrderDetailDto> {
  const response = await http.post(ADMIN_ORDER_ENDPOINTS.refundProductOrder(orderId), {
    reason,
    ...(amount !== undefined ? { amount: amount.toFixed(2) } : {}),
  })
  return storeOrderDetailSchema.parse(response.data)
}

export async function postWalkInSale(sale: WalkInSale): Promise<StoreOrderDetailDto> {
  const response = await http.post(ADMIN_ORDER_ENDPOINTS.productWalkIn, {
    ...(sale.customerName ? { customer_name: sale.customerName } : {}),
    ...(sale.customerPhone ? { customer_phone: sale.customerPhone } : {}),
    payment_method: sale.paymentMethod,
    items: sale.items.map((item) => ({ product_variant: item.productVariant, quantity: item.quantity })),
  })
  return storeOrderDetailSchema.parse(response.data)
}
