import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import type { God } from '../../domain/entities/god'

export interface GodMultiSelectProps {
  godIds: readonly string[]
  gods: readonly God[]
  open: boolean
  error?: string
  onToggleOpen: () => void
  onClose: () => void
  onToggle: (godId: string) => void
  onRemove: (godId: string) => void
}

/** Multi-select for a pooja's gods: removable chips + a dropdown of active gods, sorted alphabetically. */
export function GodMultiSelect({ godIds, gods, open, error, onToggleOpen, onClose, onToggle, onRemove }: GodMultiSelectProps) {
  const nameById = (id: string) => gods.find((g) => g.id === id)?.name ?? id
  const options = gods
    .filter((g) => g.status === 'Active')
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-1.75">
      <label className="text-sm font-medium text-ink">
        Gods <span className="text-danger">*</span>
      </label>

      {godIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {godIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.25 rounded-full bg-primary-subtle py-1 pl-2.75 pr-1.25 text-xs font-medium text-primary-subtle-text"
            >
              {nameById(id)}
              <button
                type="button"
                aria-label="Remove god"
                onClick={() => onRemove(id)}
                className="inline-flex h-4 w-4 items-center justify-center rounded-sm border-none bg-transparent p-0.5 text-inherit opacity-65 hover:opacity-100"
              >
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex h-10 w-full items-center gap-2 rounded-lg border-none bg-card px-3 text-left font-sans text-base shadow-xs hover:shadow-[inset_0_0_0_1px_var(--border-strong)]"
        >
          <Icon name="plus-circle" size={16} className="text-ink-subtle" />
          <span className="flex-1 text-ink">{godIds.length ? 'Add or remove gods' : 'Select gods'}</span>
          <Icon name="caret-down" size={14} className={cn('text-ink-subtle transition-transform duration-140 ease-ks', open && 'rotate-180')} />
        </button>

        {open && (
          <>
            <div onClick={onClose} className="fixed inset-0 z-menu" />
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-menu max-h-66 overflow-y-auto rounded-lg bg-card p-1.5 shadow-lg">
              {options.map((g) => {
                const selected = godIds.includes(g.id)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onToggle(g.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md border-none px-2.25 py-2 text-left font-sans text-sm text-ink hover:bg-hover',
                      selected ? 'bg-primary-subtle' : 'bg-transparent',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm text-white',
                        selected ? 'bg-primary' : 'bg-card shadow-[inset_0_0_0_1px_var(--border-strong)]',
                      )}
                    >
                      {selected && <Icon name="check" size={12} />}
                    </span>
                    <span className="flex-1">{g.name}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {error && <div className="text-xs text-danger">{error}</div>}
      <div className="text-2xs leading-snug text-ink-subtle">Multiple gods share one price. For a different price per god, create a separate pooja.</div>
    </div>
  )
}
