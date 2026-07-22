import { cn } from '@/shared/lib/cn'

export interface KpiTileProps {
  value: string
  label: string
  /** Optional status dot colour class, e.g. "bg-success". */
  dot?: string
}

/** Compact metric tile used in the KPI band across every list view. */
export function KpiTile({ value, label, dot }: KpiTileProps) {
  return (
    <div className="flex items-center gap-2.25 rounded-lg bg-card px-3.75 py-2.75 shadow-xs">
      {dot && <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} />}
      <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{value}</span>
      <span className="text-xs text-ink-subtle">{label}</span>
    </div>
  )
}
