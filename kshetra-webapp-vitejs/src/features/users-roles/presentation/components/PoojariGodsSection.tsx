import { Icon } from '@/shared/ui'
import type { God } from '@/features/users-roles/domain/entities/god'
import { GodPickerDropdown } from '@/features/users-roles/presentation/components/GodPickerDropdown'

export interface PoojariGodsSectionProps {
  gods: readonly God[]
  selectedIds: readonly string[]
  pickerOpen: boolean
  onTogglePicker: () => void
  onClosePicker: () => void
  onToggleGod: (godId: string) => void
  onRemoveGod: (godId: string) => void
}

/** Add/edit form — poojari-only card: assigned-gods tags + a picker dropdown. */
export function PoojariGodsSection({ gods, selectedIds, pickerOpen, onTogglePicker, onClosePicker, onToggleGod, onRemoveGod }: PoojariGodsSectionProps) {
  const selected = gods.filter((g) => selectedIds.includes(g.id))
  const pickerLabel = selectedIds.length > 0 ? `${selectedIds.length} god${selectedIds.length === 1 ? '' : 's'} selected` : 'Assign gods'

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5.5 shadow-sm">
      <div>
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Assigned gods</div>
        <div className="mt-1 text-2xs text-ink-subtle">Drives which gods&apos; poojas this poojari sees in the priest app.</div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((god) => (
            <span key={god.id} className="inline-flex items-center gap-1.25 rounded-full bg-primary-subtle py-1 pl-2.75 pr-1 text-xs font-medium text-primary-subtle-text">
              {god.name}
              <button
                type="button"
                aria-label="Remove god"
                onClick={() => onRemoveGod(god.id)}
                className="inline-flex items-center justify-center border-none bg-transparent p-0.5 text-inherit opacity-65 hover:opacity-100"
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
          onClick={onTogglePicker}
          className="flex h-10 w-full items-center gap-2 rounded-lg border-none bg-card px-3 text-left font-sans text-base shadow-xs hover:shadow-[inset_0_0_0_1px_var(--border-strong)]"
        >
          <Icon name="plus-circle" size={16} color="var(--text-subtle)" />
          <span className="flex-1 text-ink">{pickerLabel}</span>
          <Icon name="caret-down" size={14} color="var(--text-subtle)" />
        </button>
        {pickerOpen && <GodPickerDropdown gods={gods} selectedIds={selectedIds} onToggle={onToggleGod} onClose={onClosePicker} />}
      </div>
    </div>
  )
}
