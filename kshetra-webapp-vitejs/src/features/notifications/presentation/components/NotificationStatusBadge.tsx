import { Badge } from '@/shared/ui'

import type { NotificationStatus } from '@/features/notifications/domain/entities/notification'
import { notificationStatusColor } from '@/features/notifications/presentation/lib/notification-format'

interface NotificationStatusBadgeProps {
  status: NotificationStatus
}

/** Small status pill for the notifications table (Draft / Scheduled / Sent). */
export function NotificationStatusBadge({ status }: NotificationStatusBadgeProps) {
  return (
    <Badge color={notificationStatusColor(status)} size="sm">
      {status}
    </Badge>
  )
}
