import type { BadgeColor } from '@/shared/ui'

import type { Notification, NotificationAudience, NotificationStatus } from '@/features/notifications/domain/entities/notification'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function to12Hour(time: string): string {
  const [hoursStr, minutesStr] = time.split(':')
  const hours = Number(hoursStr)
  const minutes = Number(minutesStr)
  const period = hours >= 12 ? 'pm' : 'am'
  const hour12 = ((hours + 11) % 12) + 1
  return `${hour12}:${pad2(minutes)} ${period}`
}

/** "2026-06-28 06:00" → "28 Jun 2026 · 6:00 am". Blank input → em-dash. */
export function formatNotificationTime(value: string): string {
  if (!value) return '—'
  const [datePart, timePart] = value.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dateLabel = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return timePart ? `${dateLabel} · ${to12Hour(timePart)}` : dateLabel
}

/** "All users", a single nakshatra name, or an "N nakshatras" summary. */
export function notificationAudienceLabel(n: Pick<Notification, 'target' | 'naks'>): string {
  if (n.target === 'all') return 'All users'
  if (n.naks.length === 1) return n.naks[0]
  return `${n.naks.length} nakshatras`
}

export function notificationStatusColor(status: NotificationStatus): BadgeColor {
  if (status === 'Sent') return 'green'
  if (status === 'Scheduled') return 'blue'
  return 'gray'
}

/** Rough recipient estimate for the compose form's current audience selection. */
export function estimateRecipients(target: NotificationAudience, naks: readonly string[], totalUsers: number): number {
  if (target === 'all') return totalUsers
  return naks.length ? naks.length * 165 + 40 : 0
}
