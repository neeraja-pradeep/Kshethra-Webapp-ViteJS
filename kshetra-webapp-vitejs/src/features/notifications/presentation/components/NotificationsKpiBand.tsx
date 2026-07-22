import { cn } from '@/shared/lib/cn'

import type { Notification, NotificationStatus } from '@/features/notifications/domain/entities/notification'

interface NotificationsKpiBandProps {
  rows: readonly Notification[]
}

// Lower rank sorts first. Statuses outside this feature's domain still get a
// sensible fallback so the band degrades gracefully if new statuses appear.
const STATUS_RANK: Partial<Record<NotificationStatus, number>> = { Sent: 0, Scheduled: 1, Draft: 2 }
const STATUS_DOT_CLASS: Partial<Record<NotificationStatus, string>> = {
  Sent: 'bg-success',
  Scheduled: 'bg-info',
  Draft: 'bg-ink-disabled',
}

/** Total count + a per-status breakdown, each as a small elevated chip. */
export function NotificationsKpiBand({ rows }: NotificationsKpiBandProps) {
  const counts = new Map<NotificationStatus, number>()
  const order: NotificationStatus[] = []
  rows.forEach((row) => {
    const current = counts.get(row.status) ?? 0
    if (current === 0) order.push(row.status)
    counts.set(row.status, current + 1)
  })
  order.sort((a, b) => (STATUS_RANK[a] ?? 2) - (STATUS_RANK[b] ?? 2))

  return (
    <div className="flex flex-shrink-0 flex-wrap gap-2.5 px-7 pb-3.5">
      <KpiChip value={String(rows.length)} label="notifications" />
      {order.map((status) => (
        <KpiChip key={status} value={String(counts.get(status))} label={status} dotClassName={STATUS_DOT_CLASS[status] ?? 'bg-ink-subtle'} />
      ))}
    </div>
  )
}

interface KpiChipProps {
  value: string
  label: string
  dotClassName?: string
}

function KpiChip({ value, label, dotClassName }: KpiChipProps) {
  return (
    <div className="flex items-center gap-2.25 rounded-lg bg-card px-3.75 py-2.75 shadow-xs">
      {dotClassName && <span className={cn('h-2 w-2 shrink-0 rounded-full', dotClassName)} />}
      <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{value}</span>
      <span className="text-xs text-ink-subtle">{label}</span>
    </div>
  )
}
