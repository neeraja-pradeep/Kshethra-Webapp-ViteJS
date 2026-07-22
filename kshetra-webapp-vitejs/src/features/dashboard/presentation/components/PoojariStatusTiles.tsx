import type { PoojariStatusTile, PoojariStatusTone } from '@/features/dashboard/domain/entities/poojari-status'
import { Icon } from '@/shared/ui'

export interface PoojariStatusTilesProps {
  tiles: PoojariStatusTile[]
  onSelect: (tile: PoojariStatusTile) => void
}

const TONE_CLASS: Record<PoojariStatusTone, string> = {
  warning: 'bg-warning-surface text-warning shadow-[inset_0_0_0_0.5px_var(--color-warning-border)]',
  info: 'bg-info-surface text-info shadow-[inset_0_0_0_0.5px_var(--color-info-border)]',
  danger: 'bg-danger-surface text-danger shadow-[inset_0_0_0_0.5px_var(--color-danger-border)]',
}

/**
 * Poojari-management attention tiles (awaiting completion / reassigned /
 * overdue). DS hover is a soft shadow lift, not a brightness filter.
 */
export function PoojariStatusTiles({ tiles, onSelect }: PoojariStatusTilesProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5">
      {tiles.map((tile) => (
        <button
          key={tile.key}
          type="button"
          onClick={() => onSelect(tile)}
          className={`flex min-w-0 flex-col items-start gap-2 rounded-lg px-3.5 py-3.25 text-left font-sans transition-shadow duration-140 ease-ks hover:shadow-card-hover ${TONE_CLASS[tile.tone]}`}
        >
          <Icon name={tile.icon} weight={tile.iconWeight} size={18} />
          <span className="text-2xl font-bold leading-none tabular-nums text-ink-strong">{tile.value}</span>
          <span className="flex flex-col gap-px">
            <span className="text-xs font-medium text-ink">{tile.label}</span>
            <span className="text-2xs text-ink-subtle">{tile.sub}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
