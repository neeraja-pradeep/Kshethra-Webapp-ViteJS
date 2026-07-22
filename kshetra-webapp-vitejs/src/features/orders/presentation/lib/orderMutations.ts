import type { Order, OrderOccurrence, OrderReassignment } from '@/features/orders/domain/entities/order'
import { orderTotal } from '@/features/orders/presentation/lib/orderRollup'
import { nowStamp } from '@/features/orders/presentation/lib/format'

function mapOccurrences(order: Order, fn: (occ: OrderOccurrence) => OrderOccurrence): Order {
  return {
    ...order,
    lineItems: order.lineItems.map((item) => ({ ...item, occurrences: item.occurrences.map(fn) })),
  }
}

/** Cancels every occurrence in the order and marks it fully refunded, logging the amount + reason. */
export function cancelWholeOrder(order: Order, reason: string): Order {
  const total = orderTotal(order)
  const cancelled = mapOccurrences(order, (occ) => ({ ...occ, recordStatus: 'Cancelled', reassignment: null }))
  return {
    ...cancelled,
    paymentStatus: 'Refunded',
    refundLog: [...order.refundLog, { amount: total, reason, user: 'Admin', timestamp: nowStamp() }],
  }
}

/** Cancels the selected occurrences and logs a reconciliation-only partial refund. */
export function applyPartialRefund(order: Order, selectedIds: ReadonlySet<string>, amount: number, reason: string): Order {
  const updated = mapOccurrences(order, (occ) => (selectedIds.has(occ.id) ? { ...occ, recordStatus: 'Cancelled', reassignment: null } : occ))
  return {
    ...updated,
    paymentStatus: 'Partially Refunded',
    refundLog: [...order.refundLog, { amount, reason, user: 'Admin', timestamp: nowStamp() }],
  }
}

export function cancelOccurrence(order: Order, occurrenceId: string): Order {
  return mapOccurrences(order, (occ) => (occ.id === occurrenceId ? { ...occ, recordStatus: 'Cancelled', reassignment: null } : occ))
}

export function markOccurrenceComplete(order: Order, occurrenceId: string): Order {
  return mapOccurrences(order, (occ) => (occ.id === occurrenceId ? { ...occ, recordStatus: 'Completed', reassignment: null } : occ))
}

export function markOccurrenceForRefund(order: Order, occurrenceId: string): Order {
  return mapOccurrences(order, (occ) => (occ.id === occurrenceId ? { ...occ, refund: 'pending' } : occ))
}

export function markOccurrenceRefunded(order: Order, occurrenceId: string): Order {
  return mapOccurrences(order, (occ) => (occ.id === occurrenceId ? { ...occ, refund: 'refunded' } : occ))
}

/** Reassigns one occurrence's officiating priest, giving it a fresh 24-hour completion window. */
export function reassignOccurrence(order: Order, occurrenceId: string, priest: string): Order {
  const reassignment: OrderReassignment = { priest, deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
  return mapOccurrences(order, (occ) => (occ.id === occurrenceId ? { ...occ, reassignment } : occ))
}

/** Amount a single occurrence contributes to its order total (its line item's per-date price). */
export function occurrenceAmount(order: Order, occurrenceId: string): number {
  for (const item of order.lineItems) {
    if (item.occurrences.some((o) => o.id === occurrenceId)) return item.basePrice * Math.max(1, item.people.length)
  }
  return 0
}
