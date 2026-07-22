export interface BookingsKpiBandProps {
  total: number
  pending: number
  completed: number
  cancelled: number
}

/** Total + Pending/Completed/Cancelled stat tiles above the table. */
export function BookingsKpiBand({ total, pending, completed, cancelled }: BookingsKpiBandProps) {
  const items: { key: string; value: number; label: string; dotColor?: string }[] = [
    { key: 'total', value: total, label: total === 1 ? 'booking' : 'bookings' },
    { key: 'pending', value: pending, label: 'Pending', dotColor: 'var(--color-warning)' },
    { key: 'completed', value: completed, label: 'Completed', dotColor: 'var(--color-success)' },
    { key: 'cancelled', value: cancelled, label: 'Cancelled', dotColor: 'var(--color-danger)' },
  ]
  return (
    <div className="flex flex-wrap gap-2.5 px-7 pb-3.5">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2.25 rounded-lg bg-card px-3.75 py-2.75 shadow-xs">
          {item.dotColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.dotColor }} />}
          <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{item.value.toLocaleString('en-IN')}</span>
          <span className="text-xs text-ink-subtle">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
