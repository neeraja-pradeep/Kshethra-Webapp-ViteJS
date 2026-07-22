import { cn } from '@/shared/lib/cn'

export interface StatTileProps {
  value: string
  label: string
  /** Narrower tile used in the poojari panel (source: min-width 130px vs. 140px). */
  compact?: boolean
}

/** Small sunken tile used inside role-activity panels: bold value + muted label. */
export function StatTile({ value, label, compact = false }: StatTileProps) {
  return (
    <div className={cn('flex flex-1 flex-col gap-1 rounded-lg bg-sunken px-4 py-3.5', compact ? 'min-w-[130px]' : 'min-w-[140px]')}>
      <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{value}</span>
      <span className="text-xs text-ink-subtle">{label}</span>
    </div>
  )
}
