import { Button, Icon, IconButton } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'
import type { Booking } from '@/features/bookings/domain/entities/booking'
import { BookingStatusBadge } from '@/features/bookings/presentation/components/BookingStatusBadge'
import { DetailRow } from '@/features/bookings/presentation/components/DetailRow'
import { formatFullDate } from '@/features/bookings/presentation/lib/date'

export interface BookingDetailDrawerProps {
  booking: Booking
  onClose: () => void
  onMarkComplete: () => void
  onReassign: () => void
}

/** Right-side slide-over — read-first view of a single person's booking. */
export function BookingDetailDrawer({ booking, onClose, onMarkComplete, onReassign }: BookingDetailDrawerProps) {
  const actionable = booking.status === 'Pending'

  return (
    <div className="fixed inset-y-0 right-0 z-drawer flex w-full flex-col bg-sunken shadow-xl sm:w-[560px]">
      <div className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-stroke bg-card px-6">
        <IconButton label="Back" variant="ghost" onClick={onClose}>
          <Icon name="arrow-left" size={18} />
        </IconButton>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-overline text-ink-subtle">Pooja Bookings</span>
          <span className="text-stroke-strong">/</span>
          <span className="truncate text-base font-semibold text-ink-strong">
            {booking.poojaName} · {booking.person}
          </span>
        </div>
        <BookingStatusBadge label={booking.status} tone={booking.statusTone} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[880px] flex-col gap-4 p-6 pb-14">
          <div className="flex flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
            <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Booking</span>
            <DetailRow label="Pooja">{booking.poojaName}</DetailRow>
            <DetailRow label="God">{booking.godName}</DetailRow>
            <DetailRow label="Pooja date">
              <span className="tabular-nums">{formatFullDate(booking.poojaDate)}</span>
            </DetailRow>
            <DetailRow label="Person">{booking.person}</DetailRow>
            <DetailRow label="Nakshatra">{booking.nakshatra || '—'}</DetailRow>
            <DetailRow label="Poojari">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="user-circle" size={15} color="var(--text-subtle)" />
                {booking.poojari}
              </span>
            </DetailRow>
            <DetailRow label="Amount">
              <span className="tabular-nums">{formatINR(booking.amount)}</span>
            </DetailRow>
          </div>

          {actionable && (
            <div className="flex flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
              <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Actions</span>
              <div className="flex flex-wrap gap-2.5">
                <Button theme="primary" iconLeft={<Icon name="seal-check" size={16} />} onClick={onMarkComplete}>
                  Mark as completed
                </Button>
                <Button theme="default" variant="outline" iconLeft={<Icon name="arrows-clockwise" size={16} />} onClick={onReassign}>
                  Reassign poojari
                </Button>
              </div>
              <div className="flex items-center gap-1.75 text-xs text-ink-subtle">
                <Icon name="clock-countdown" size={14} />A reassigned pooja must be completed within 24 hours.
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
            <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Parent order</span>
            <div className="flex items-center justify-between gap-4">
              <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Order</span>
              <span className="inline-flex items-center gap-1.25 text-sm font-semibold text-primary">
                {booking.orderRef}
                <Icon name="arrow-up-right" size={13} />
              </span>
            </div>
            <DetailRow label="Receipt">
              <span className="tabular-nums">{booking.receiptRef}</span>
            </DetailRow>
            <DetailRow label="Order total">
              <span className="tabular-nums">{formatINR(booking.orderTotal)}</span>
            </DetailRow>
            <div className="flex items-center justify-between gap-4">
              <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Payment</span>
              <BookingStatusBadge label={booking.paymentStatus} tone={booking.paymentTone} />
            </div>
            <div className="flex items-center gap-1.75 border-t border-stroke-subtle pt-2.75 text-xs text-ink-subtle">
              <Icon name="info" size={14} />
              Cancellation and refunds are managed on the parent order.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
