import { cn } from '@/shared/lib/cn'

export interface KpiTileProps {
  value: string
  label: string
  /** Tailwind background class for the small status dot, e.g. "bg-success". Omit for no dot. */
  dotClassName?: string
  /** When provided the tile renders as a clickable filter toggle. */
  onClick?: () => void
  /** Whether this toggle is the active filter (ring highlight). */
  active?: boolean
  className?: string
}

/** KPI band tile — value + label, optionally a clickable status-filter toggle. */
export function KpiTile({ value, label, dotClassName, onClick, active = false, className }: KpiTileProps) {
  const shared = cn(
    'inline-flex items-center gap-2.5 rounded-lg bg-card px-3.75 py-2.75 font-sans',
    onClick
      ? cn(
          'shadow-xs ring-1 ring-inset transition-shadow duration-120 ease-ks',
          active ? 'ring-2 ring-primary' : 'ring-stroke hover:ring-primary-border hover:shadow-sm',
        )
      : 'shadow-sm',
    className,
  )

  const content = (
    <>
      {dotClassName && <span className={cn('h-2.25 w-2.25 shrink-0 rounded-full', dotClassName)} />}
      <span className="text-2xl font-bold tabular-nums leading-none text-ink-strong">{value}</span>
      <span className="text-xs text-ink-subtle">{label}</span>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(shared, 'cursor-pointer border-none')}>
        {content}
      </button>
    )
  }
  return <div className={shared}>{content}</div>
}
