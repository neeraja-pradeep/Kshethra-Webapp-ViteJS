import { Badge, type BadgeColor } from '@/shared/ui'
import type { StatusTone } from '@/features/bookings/domain/entities/booking'

const COLOR_BY_TONE: Record<StatusTone, BadgeColor> = {
  success: 'green',
  warning: 'amber',
  danger: 'red',
  info: 'blue',
  neutral: 'gray',
}

export interface BookingStatusBadgeProps {
  label: string
  tone: StatusTone
}

/** Dot + tint status pill — mirrors the prototype's `bkBadge` helper. */
export function BookingStatusBadge({ label, tone }: BookingStatusBadgeProps) {
  return (
    <Badge color={COLOR_BY_TONE[tone]} size="sm" dot>
      {label}
    </Badge>
  )
}
