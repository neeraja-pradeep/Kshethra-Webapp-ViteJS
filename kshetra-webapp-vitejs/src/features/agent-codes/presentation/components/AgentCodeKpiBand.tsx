import { cn } from '@/shared/lib/cn'

/** One tile in the KPI band above the agent-code table. */
export interface AgentCodeKpi {
  readonly label: string
  readonly value: string
  /** Tailwind background-color class for the status dot, or undefined for the total tile. */
  readonly dotClassName?: string
}

export interface AgentCodeKpiBandProps {
  kpis: AgentCodeKpi[]
}

/** Row of small card tiles: total codes, then a count per status present in the filtered set. */
export function AgentCodeKpiBand({ kpis }: AgentCodeKpiBandProps) {
  return (
    <div className="flex flex-shrink-0 flex-wrap gap-2.5 px-7 pb-3.5">
      {kpis.map((k) => (
        <div key={k.label} className="flex items-center gap-2.25 rounded-lg bg-card px-3.75 py-2.75 shadow-xs">
          {k.dotClassName && <span className={cn('h-2 w-2 shrink-0 rounded-full', k.dotClassName)} />}
          <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{k.value}</span>
          <span className="text-2xs text-ink-subtle">{k.label}</span>
        </div>
      ))}
    </div>
  )
}
