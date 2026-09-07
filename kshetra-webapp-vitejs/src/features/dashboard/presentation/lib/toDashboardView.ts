import { formatINR } from '@/shared/lib/format'

import type {
  CounterBookingsSnapshot,
  PoojaBookingsSnapshot,
  PoojariManagementSnapshot,
  StoreOrdersSnapshot,
} from '@/features/dashboard/domain/entities/dashboard-snapshot'
import type { FulfilmentStage } from '@/features/dashboard/domain/entities/fulfilment-stage'
import type { PoojariStatusTile } from '@/features/dashboard/domain/entities/poojari-status'
import type { StatTile } from '@/features/dashboard/domain/entities/stat-tile'

/**
 * Server counts → the shapes the cards already render.
 *
 * The labels, icons and tones live here rather than on the wire: they are how
 * this screen presents a number, not something the API has an opinion about.
 */

export function toPoojaBookingStats(snapshot: PoojaBookingsSnapshot): StatTile[] {
  return [
    { value: String(snapshot.today), label: 'Poojas today' },
    { value: String(snapshot.nextSevenDaysTotal), label: 'Next 7 days' },
    { value: formatINR(snapshot.collectedThisMonth), label: 'Collected this month' },
  ]
}

export function toCounterBookingStats(snapshot: CounterBookingsSnapshot): StatTile[] {
  return [
    { value: formatINR(snapshot.collectionToday), label: 'Collection today' },
    { value: String(snapshot.receiptsToday), label: 'Receipts today' },
    { value: String(snapshot.poojasBookedToday), label: 'Poojas booked' },
  ]
}

export function toStoreOrderStats(snapshot: StoreOrdersSnapshot): StatTile[] {
  return [
    { value: String(snapshot.open), label: 'Open orders' },
    { value: String(snapshot.delivered), label: 'Delivered' },
    { value: String(snapshot.cancelled), label: 'Cancelled' },
  ]
}

/**
 * The four stages the card plots, in lifecycle order.
 *
 * `pending`, `confirmed` and `cancelled` are counted by the server but not
 * drawn: the bar chart is the *work in progress* through the shop, and the
 * three stat tiles above it already carry the totals. Read straight off
 * `fulfilment`, which is always zero-filled, so a stage the shop currently has
 * none of still renders its row at zero instead of vanishing.
 */
export function toFulfilmentStages(snapshot: StoreOrdersSnapshot): FulfilmentStage[] {
  const { fulfilment } = snapshot
  return [
    { label: 'Processing', icon: 'hourglass-medium', tone: 'primary', count: fulfilment.processing },
    { label: 'Packed', icon: 'package', tone: 'warning', count: fulfilment.packed },
    { label: 'Shipped', icon: 'truck', tone: 'info', count: fulfilment.shipped },
    { label: 'Delivered', icon: 'check-circle', tone: 'success', count: fulfilment.delivered },
  ]
}

/**
 * The two poojari counts the server can derive.
 *
 * "Reassigned" is deliberately absent: `assign_poojari()` overwrites the
 * poojari in place with no history and no counter, so a booking handed to a
 * second poojari is indistinguishable from one assigned once. A made-up figure
 * on a card the temple acts on would be worse than an absent one.
 *
 * The two overlap on purpose — a booking assigned yesterday *for* yesterday is
 * in both — so they are rendered as two independent counts and never summed.
 */
export function toPoojariStatusTiles(snapshot: PoojariManagementSnapshot): PoojariStatusTile[] {
  return [
    {
      key: 'awaiting',
      value: snapshot.awaitingCompletion,
      label: 'Awaiting completion',
      sub: 'Date passed — needs action',
      icon: 'warning-circle',
      iconWeight: 'fill',
      tone: 'warning',
    },
    {
      key: 'overdue',
      value: snapshot.overdue,
      label: 'Overdue',
      sub: 'Reassign again',
      icon: 'warning-octagon',
      iconWeight: 'fill',
      tone: 'danger',
    },
  ]
}
