import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import type { God } from '@/features/users-roles/domain/entities/god'

export interface GodPickerDropdownProps {
  gods: readonly God[]
  selectedIds: readonly string[]
  onToggle: (godId: string) => void
  onClose: () => void
}

/** Popover checklist for assigning gods to a poojari, opened from the picker button. */
export function GodPickerDropdown({ gods, selectedIds, onToggle, onClose }: GodPickerDropdownProps) {
  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onClose} />
      <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[56] max-h-[264px] overflow-y-auto rounded-lg bg-card p-1.5 shadow-lg">
        {gods.map((god) => {
          const selected = selectedIds.includes(god.id)
          return (
            <button
              key={god.id}
              type="button"
              onClick={() => onToggle(god.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md border-none px-2.25 py-2 text-left text-sm text-ink hover:bg-hover',
                selected ? 'bg-hover' : 'bg-transparent',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-sm text-white',
                  selected ? 'bg-primary shadow-none' : 'bg-transparent shadow-[inset_0_0_0_1px_var(--border-strong)]',
                )}
              >
                {selected && <Icon name="check" size={12} />}
              </span>
              <span className="flex-1">{god.name}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
