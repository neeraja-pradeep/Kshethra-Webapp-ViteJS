import { Badge, Icon } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

import type { Devotee } from '@/features/devotees/domain/entities/devotee'
import { bookingStatusColor, bookingTypeColor } from '@/features/devotees/presentation/lib/badgeColors'
import { formatDisplayDate } from '@/features/devotees/presentation/lib/formatDate'

export interface DevoteeBookingHistoryCardProps {
  devotee: Devotee
  onOpenBooking?: (ref: string) => void
}

/** Pooja bookings + store orders placed on this account. */
export function DevoteeBookingHistoryCard({ devotee, onOpenBooking }: DevoteeBookingHistoryCardProps) {
  const bookings = devotee.bookings
  const countLabel = `${bookings.length} ${bookings.length === 1 ? 'order' : 'orders'}`

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Booking history</div>
        <div className="flex-1" />
        <span className="text-2xs text-ink-subtle">{countLabel}</span>
      </div>

      {bookings.length > 0 && (
        <div className="flex flex-col overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--border-subtle)]">
          <div className="flex items-center gap-3 bg-sunken px-3.5 py-2 text-2xs font-semibold uppercase tracking-header text-ink-subtle">
            <span className="w-28">Order ref</span>
            <span className="w-[100px]">Date</span>
            <span className="w-20">Type</span>
            <span className="flex-1 text-right">Total</span>
            <span className="w-[120px] text-right">Status</span>
            <span className="w-4.5" />
          </div>
          {bookings.map((booking) => (
            <button
              key={booking.ref}
              type="button"
              onClick={() => onOpenBooking?.(booking.ref)}
              className="flex cursor-pointer items-center gap-3 border-0 border-t border-t-stroke-subtle bg-transparent px-3.5 py-2.75 text-left text-sm transition-[background] duration-120 ease-ks hover:bg-hover"
            >
              <span className="w-28 font-semibold text-ink-strong">{booking.ref}</span>
              <span className="w-[100px] whitespace-nowrap text-ink-muted">{formatDisplayDate(booking.date)}</span>
              <span className="w-20">
                <Badge color={bookingTypeColor(booking.type)} size="sm">
                  {booking.type}
                </Badge>
              </span>
              <span className="flex-1 text-right tabular-nums text-ink">{formatINR(booking.total)}</span>
              <span className="flex w-[120px] justify-end">
                <Badge color={bookingStatusColor(booking.status)} size="sm">
                  {booking.status}
                </Badge>
              </span>
              <Icon name="caret-right" size={13} className="w-4.5 text-ink-subtle" />
            </button>
          ))}
        </div>
      )}

      {bookings.length === 0 && <div className="px-0.5 py-5 text-sm text-ink-subtle">No orders or bookings on this account yet.</div>}
    </div>
  )
}
