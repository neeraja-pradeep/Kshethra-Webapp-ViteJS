import { Badge, Icon } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

import type { DevoteeDetail } from '@/features/devotees/domain/entities/devotee'
import { statusColor, statusLabel } from '@/features/devotees/presentation/lib/badgeColors'
import { formatDisplayDate } from '@/features/devotees/presentation/lib/formatDate'

/** What the server sends at most of each. Enough to see the shape of an account. */
const RECENT_LIMIT = 10

export interface DevoteeBookingHistoryCardProps {
  devotee: DevoteeDetail
  onOpenPoojaOrder?: (orderId: number) => void
  onOpenShopOrder?: (orderId: number) => void
}

/**
 * What has happened on this account: pooja bookings and shop orders.
 *
 * Kept as two lists rather than merged into one. They are different records —
 * a booking is one pooja for one person on one date, a shop order is a basket —
 * and folding them together would mean dropping the columns that make each one
 * legible, for the sake of a single date column.
 *
 * The bookings here **include** cancelled dates, which the BOOKINGS column on
 * the table leaves out. That is deliberate on the server's part: the count
 * answers how much the devotee has booked, this list answers what has happened
 * on the account. The caption says so, rather than leaving the two figures to
 * look like a bug.
 */
export function DevoteeBookingHistoryCard({ devotee, onOpenPoojaOrder, onOpenShopOrder }: DevoteeBookingHistoryCardProps) {
  const { recentBookings, recentOrders } = devotee
  const truncated = recentBookings.length >= RECENT_LIMIT || recentOrders.length >= RECENT_LIMIT

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Recent activity</div>
        <div className="flex-1" />
        <span className="text-2xs text-ink-subtle">
          {truncated ? `Latest ${RECENT_LIMIT} of each` : 'Cancelled dates included'}
        </span>
      </div>

      <section className="flex flex-col gap-2">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
          Pooja bookings · {devotee.bookingCount} counted
        </div>
        {recentBookings.length > 0 ? (
          <div className="flex flex-col overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--border-subtle)]">
            <div className="flex items-center gap-3 bg-sunken px-3.5 py-2 text-2xs font-semibold uppercase tracking-header text-ink-subtle">
              <span className="w-24">Order</span>
              <span className="w-[100px]">Date</span>
              <span className="min-w-0 flex-1">Pooja</span>
              <span className="w-32">Booked for</span>
              <span className="w-24 text-right">Price</span>
              <span className="w-[104px] text-right">Status</span>
              <span className="w-4.5" />
            </div>
            {recentBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => onOpenPoojaOrder?.(booking.orderId)}
                className="flex cursor-pointer items-center gap-3 border-0 border-t border-t-stroke-subtle bg-transparent px-3.5 py-2.75 text-left text-sm transition-[background] duration-120 ease-ks hover:bg-hover"
              >
                <span className="w-24 font-semibold text-ink-strong">PO-{booking.orderId}</span>
                <span className="w-[100px] whitespace-nowrap text-ink-muted">{formatDisplayDate(booking.date)}</span>
                <span className="min-w-0 flex-1 truncate text-ink">{booking.pooja ?? '—'}</span>
                <span className="w-32 truncate text-ink-muted">{booking.bookedFor ?? '—'}</span>
                <span className="w-24 text-right tabular-nums text-ink">{formatINR(booking.price)}</span>
                <span className="flex w-[104px] justify-end">
                  {/* The line's own status. `poojaStatus` says whether it has been performed. */}
                  <Badge color={statusColor(booking.status)} size="sm">
                    {statusLabel(booking.status)}
                  </Badge>
                </span>
                <Icon name="caret-right" size={13} className="w-4.5 text-ink-subtle" />
              </button>
            ))}
          </div>
        ) : (
          <div className="px-0.5 py-3 text-sm text-ink-subtle">No pooja bookings on this account.</div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Shop orders</div>
        {recentOrders.length > 0 ? (
          <div className="flex flex-col overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--border-subtle)]">
            <div className="flex items-center gap-3 bg-sunken px-3.5 py-2 text-2xs font-semibold uppercase tracking-header text-ink-subtle">
              <span className="w-24">Order</span>
              <span className="w-[140px]">Placed</span>
              <span className="min-w-0 flex-1">Payment</span>
              <span className="w-24 text-right">Total</span>
              <span className="w-[104px] text-right">Status</span>
              <span className="w-4.5" />
            </div>
            {recentOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onOpenShopOrder?.(order.id)}
                className="flex cursor-pointer items-center gap-3 border-0 border-t border-t-stroke-subtle bg-transparent px-3.5 py-2.75 text-left text-sm transition-[background] duration-120 ease-ks hover:bg-hover"
              >
                <span className="w-24 font-semibold text-ink-strong">SO-{order.id}</span>
                <span className="w-[140px] whitespace-nowrap text-ink-muted">{formatDisplayDate(order.createdAt)}</span>
                <span className="min-w-0 flex-1">
                  <Badge color={statusColor(order.paymentStatus)} size="sm">
                    {statusLabel(order.paymentStatus)}
                  </Badge>
                </span>
                <span className="w-24 text-right tabular-nums text-ink">{formatINR(order.total)}</span>
                <span className="flex w-[104px] justify-end">
                  <Badge color={statusColor(order.status)} size="sm">
                    {statusLabel(order.status)}
                  </Badge>
                </span>
                <Icon name="caret-right" size={13} className="w-4.5 text-ink-subtle" />
              </button>
            ))}
          </div>
        ) : (
          <div className="px-0.5 py-3 text-sm text-ink-subtle">No shop orders on this account.</div>
        )}
      </section>
    </div>
  )
}
