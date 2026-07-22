import type { Order, OrderOccurrence, OrderRecordStatus } from '@/features/orders/domain/entities/order'

/** Every occurrence across every line item, in booking order. */
export function allOccurrences(order: Order): readonly OrderOccurrence[] {
  return order.lineItems.flatMap((item) => item.occurrences)
}

/** Earliest scheduled date across the order — used for the "Order date" column and date filter. */
export function orderDate(order: Order): string {
  const dates = allOccurrences(order).map((o) => o.date)
  return dates.reduce((min, d) => (d < min ? d : min), dates[0] ?? '')
}

/** Total pooja occurrences booked (counts each date of a repeated pooja separately). */
export function orderPoojaCount(order: Order): number {
  return allOccurrences(order).length
}

/** Sum of basePrice × people × occurrences across every line item. */
export function orderTotal(order: Order): number {
  return order.lineItems.reduce((sum, item) => sum + item.basePrice * Math.max(1, item.people.length) * item.occurrences.length, 0)
}

/** One line item's subtotal (basePrice × people × dates). */
export function lineItemTotal(item: Order['lineItems'][number]): number {
  return item.basePrice * Math.max(1, item.people.length) * item.occurrences.length
}

/**
 * Order-level booking status, rolled up from every occurrence: all cancelled
 * → Cancelled; every occurrence finished (completed or cancelled), at least
 * one completed → Completed; otherwise Pending.
 */
export function orderBookingStatus(order: Order): OrderRecordStatus {
  const occs = allOccurrences(order)
  const count = occs.length
  const nCancelled = occs.filter((o) => o.recordStatus === 'Cancelled').length
  const nCompleted = occs.filter((o) => o.recordStatus === 'Completed').length
  if (count > 0 && nCancelled === count) return 'Cancelled'
  if (nCompleted > 0 && nCompleted + nCancelled === count) return 'Completed'
  return 'Pending'
}

/** Every distinct person the order was booked for ("Booked for" chips). */
export function orderFamilyMembers(order: Order): readonly string[] {
  const seen: string[] = []
  order.lineItems.forEach((item) =>
    item.people.forEach((p) => {
      if (!seen.includes(p.name)) seen.push(p.name)
    }),
  )
  return seen
}

/** Lower-cased search haystack: ref, devotee, agent code, staff, payment method, channel, pooja names, phone (both forms). */
export function orderSearchHay(order: Order): string {
  const poojaNames = order.lineItems.map((i) => i.poojaName).join(' ')
  return [
    order.ref,
    order.devoteeName,
    order.agentCode ?? '',
    order.counterStaff ?? '',
    order.paymentMethod,
    order.channel,
    order.phone,
    order.phone.replace(/[^0-9]/g, ''),
    poojaNames,
  ]
    .join(' ')
    .toLowerCase()
}
