export interface DevoteesKpiBandProps {
  total: number
  active: number
  suspended: number
}

/**
 * Total + Active/Suspended stat tiles above the table.
 *
 * The three come from the server's `summary`, counted over the whole searched
 * set rather than the loaded page, so they hold still while paging. They are
 * counted over the search but *not* over the status filter — which is what lets
 * a tile stay a way back to the other two once one has been clicked.
 */
export function DevoteesKpiBand({ total, active, suspended }: DevoteesKpiBandProps) {
  const items: { key: string; value: number; label: string; dotColor?: string }[] = [
    { key: 'total', value: total, label: total === 1 ? 'devotee' : 'devotees' },
    { key: 'active', value: active, label: 'Active', dotColor: 'var(--color-success)' },
    { key: 'suspended', value: suspended, label: 'Suspended', dotColor: 'var(--color-warning)' },
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
