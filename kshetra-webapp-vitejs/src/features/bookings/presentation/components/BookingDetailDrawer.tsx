import { Alert, Button, Icon, IconButton } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'
import type { Booking } from '@/features/bookings/domain/entities/booking'
import { isCompletable, primaryGodName } from '@/features/bookings/domain/entities/booking'
import { BookingStatusBadge } from '@/features/bookings/presentation/components/BookingStatusBadge'
import { DetailRow } from '@/features/bookings/presentation/components/DetailRow'
import {
  bookedByLabel,
  channelLabel,
  paymentLabel,
  paymentTone,
  statusLabel,
  statusTone,
} from '@/features/bookings/presentation/lib/bookingDisplay'
import { formatFullDate } from '@/features/bookings/presentation/lib/date'

export interface BookingDetailDrawerProps {
  booking: Booking
  /** `rbac.manage_pooja_orders` — recording that a pooja was performed. */
  canComplete: boolean
  /** `rbac.assign_poojari` — rostering, deliberately a separate permission. */
  canAssign: boolean
  busy: boolean
  onClose: () => void
  onMarkComplete: () => void
  onReassign: () => void
}

/** Right-side slide-over — read-first view of a single person's booking. */
export function BookingDetailDrawer({
  booking,
  canComplete,
  canAssign,
  busy,
  onClose,
  onMarkComplete,
  onReassign,
}: BookingDetailDrawerProps) {
  const completable = isCompletable(booking)
  const showActions = (canComplete && completable) || canAssign

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
            {booking.pooja.name} · {booking.person.name}
          </span>
        </div>
        <span className="min-w-0 shrink">
          <BookingStatusBadge label={statusLabel(booking.status)} tone={statusTone(booking.status)} />
        </span>
        {/* A slide-over needs a way out at the edge it opened from — the back
            arrow reads as navigation, not as closing the panel. */}
        <IconButton label="Close" variant="ghost" onClick={onClose}>
          <Icon name="x" size={18} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[880px] flex-col gap-4 p-6 pb-14">
          {booking.isOverdue && (
            <Alert type="warning" icon={<Icon name="clock-countdown" size={16} />}>
              Past its completion window. Nothing expires on its own — reassign it or record it as performed.
            </Alert>
          )}

          <div className="flex flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
            <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Booking</span>
            <DetailRow label="Pooja">{booking.pooja.name}</DetailRow>
            <DetailRow label="God">{primaryGodName(booking) || '—'}</DetailRow>
            <DetailRow label="Pooja date">
              <span className="tabular-nums">{booking.poojaDate ? formatFullDate(booking.poojaDate) : '—'}</span>
            </DetailRow>
            <DetailRow label="Person">{booking.person.name || '—'}</DetailRow>
            <DetailRow label="Nakshatra">{booking.person.nakshatram || '—'}</DetailRow>
            <DetailRow label="Poojari">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="user-circle" size={15} color="var(--text-subtle)" />
                {booking.poojari?.name ?? <span className="text-ink-subtle">Unassigned</span>}
              </span>
            </DetailRow>
            <DetailRow label="Booked via">
              {channelLabel(booking.channel)} · {bookedByLabel(booking)}
            </DetailRow>
            {booking.remarks && <DetailRow label="Remarks">{booking.remarks}</DetailRow>}
            <DetailRow label="Amount">
              <span className="tabular-nums">{formatINR(booking.price)}</span>
            </DetailRow>
          </div>

          {showActions && (
            <div className="flex flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
              <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Actions</span>
              <div className="flex flex-wrap gap-2.5">
                {canComplete && completable && (
                  <Button theme="primary" disabled={busy} iconLeft={<Icon name="seal-check" size={16} />} onClick={onMarkComplete}>
                    Mark as completed
                  </Button>
                )}
                {canAssign && (
                  <Button
                    theme="default"
                    variant="outline"
                    disabled={busy}
                    iconLeft={<Icon name="arrows-clockwise" size={16} />}
                    onClick={onReassign}
                  >
                    {booking.poojari ? 'Reassign poojari' : 'Assign poojari'}
                  </Button>
                )}
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
                {booking.orderReference}
                <Icon name="arrow-up-right" size={13} />
              </span>
            </div>
            <DetailRow label="Receipt">
              <span className="tabular-nums">{booking.order.receiptNo || '—'}</span>
            </DetailRow>
            <DetailRow label="Order total">
              <span className="tabular-nums">{formatINR(booking.order.total)}</span>
            </DetailRow>
            <div className="flex items-center justify-between gap-4">
              <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Payment</span>
              <BookingStatusBadge
                label={paymentLabel(booking.order.paymentStatus)}
                tone={paymentTone(booking.order.paymentStatus)}
              />
            </div>
            <div className="text-xs leading-snug text-ink-subtle">
              The order total covers every booking on it — this page records only this one.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
