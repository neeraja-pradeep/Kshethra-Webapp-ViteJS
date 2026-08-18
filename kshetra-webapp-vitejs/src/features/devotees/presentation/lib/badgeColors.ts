import type { BadgeColor } from '@/shared/ui'

import type { DevoteeStatus } from '@/features/devotees/domain/entities/devotee'

/** Account status -> Badge color. */
export function devoteeStatusColor(status: DevoteeStatus): BadgeColor {
  return status === 'active' ? 'green' : 'amber'
}

/**
 * A booking or order status -> Badge color.
 *
 * Matched on the raw server string rather than a parsed enum: the detail call
 * carries the stored value of four different status fields (a line's, a pooja's,
 * a shop order's and its payment's), and inventing a union for each here would
 * be four places to miss a new value the server starts sending. Anything
 * unrecognised falls through to neutral grey, which is the honest rendering of
 * a word this screen does not know.
 */
export function statusColor(status: string): BadgeColor {
  const value = status.toLowerCase()
  if (value === 'completed' || value === 'confirmed' || value === 'delivered' || value === 'paid') return 'green'
  if (value === 'cancelled' || value === 'failed') return 'red'
  if (value === 'refunded' || value === 'partially_refunded' || value === 'shipped') return 'blue'
  if (value === 'pending' || value === 'processing' || value === 'awaiting_counter_payment') return 'amber'
  return 'gray'
}

/** `pending_delivery` and the like are stored snake_case but printed as words. */
export function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}
