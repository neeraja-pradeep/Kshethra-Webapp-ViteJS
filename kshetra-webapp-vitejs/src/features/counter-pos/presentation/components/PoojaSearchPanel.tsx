import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Icon, Input } from '@/shared/ui'

import type { God } from '@/features/counter-pos/domain/entities/god'
import type { Pooja } from '@/features/counter-pos/domain/entities/pooja'

export interface PoojaSearchPanelProps {
  search: string
  onSearchChange: (value: string) => void
  browseOpen: boolean
  onToggleBrowse: () => void
  gods: readonly God[]
  browseGodId: string | null
  onSelectGod: (id: string) => void
  results: readonly Pooja[]
  /** Total matches before the display list is capped — may exceed `results.length`. */
  resultCount: number
  godNameOf: (godId: string) => string
  onPick: (pooja: Pooja) => void
}

/** Search + browse-by-god pooja catalogue, with an "add to booking" result list. */
export function PoojaSearchPanel({
  search,
  onSearchChange,
  browseOpen,
  onToggleBrowse,
  gods,
  browseGodId,
  onSelectGod,
  results,
  resultCount,
  godNameOf,
  onPick,
}: PoojaSearchPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
      <div className="flex-shrink-0 border-b border-stroke-subtle px-4 pb-3 pt-3.5">
        <Input
          size="md"
          placeholder="Search poojas by name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={16} />}
          autoFocus
        />
        <div className="mt-2.5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleBrowse}
            className="inline-flex items-center gap-1.5 border-none bg-transparent py-0.5 text-xs font-medium text-ink-muted"
          >
            <Icon name="caret-right" size={12} className={cn('transition-transform duration-140 ease-ks', browseOpen && 'rotate-90')} />
            Browse by god
          </button>
          <div className="flex-1" />
          <span className="text-xs text-ink-subtle">{results.length} poojas</span>
        </div>
        {browseOpen && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {gods.map((g) => {
              const selected = g.id === browseGodId
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelectGod(g.id)}
                  className={cn(
                    'rounded-full border-none px-2.75 py-1.25 text-xs font-medium',
                    selected ? 'bg-primary-subtle text-primary-subtle-text ring-2 ring-inset ring-primary' : 'bg-card text-ink ring-1 ring-inset ring-stroke-strong',
                  )}
                >
                  {g.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0.75 overflow-y-auto px-2.5 py-2">
        {results.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className="flex w-full items-center gap-3 rounded-lg border-none bg-transparent px-3 py-2.5 text-left transition-[background] duration-120 ease-ks hover:bg-hover"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink-strong">{p.name}</div>
              <div className="text-xs text-ink-subtle">{godNameOf(p.godIds[0] ?? '')}</div>
            </div>
            <span className="flex-shrink-0 text-sm font-bold tabular-nums text-ink-strong">{formatINR(p.offlinePrice)}</span>
            <span className="flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary">
              <Icon name="plus" size={14} />
            </span>
          </button>
        ))}
        {results.length === 0 && (
          <div className="px-7 py-7 text-center text-sm text-ink-subtle">No poojas match. Try another name or browse by god.</div>
        )}
      </div>
    </div>
  )
}
