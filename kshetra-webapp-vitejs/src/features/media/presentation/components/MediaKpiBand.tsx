import { cn } from '@/shared/lib/cn'

export interface MediaKpi {
  key: string
  value: string
  label: string
  /** Tailwind bg-* class for the 8px status dot; omit for the plain total tile. */
  dotClassName?: string
}

interface MediaKpiBandProps {
  kpis: MediaKpi[]
}

/** Row of small KPI chips: total tracks + a count per status present in the filtered set. */
export function MediaKpiBand({ kpis }: MediaKpiBandProps) {
  return (
    <div className="flex flex-shrink-0 flex-wrap gap-2.5 px-7 pb-3.5">
      {kpis.map((k) => (
        <div key={k.key} className="flex items-center gap-2.25 rounded-lg bg-card px-3.75 py-2.75 shadow-xs">
          {k.dotClassName && <span className={cn('h-2 w-2 shrink-0 rounded-full', k.dotClassName)} />}
          <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{k.value}</span>
          <span className="text-2xs text-ink-subtle">{k.label}</span>
        </div>
      ))}
    </div>
  )
}
