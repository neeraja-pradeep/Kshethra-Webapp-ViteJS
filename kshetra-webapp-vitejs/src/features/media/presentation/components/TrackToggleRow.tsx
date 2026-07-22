import { Switch } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import { FieldHint } from './FieldHint'
import { FieldLabel } from './FieldLabel'

interface TrackToggleRowProps {
  title: string
  hint: string
  checked: boolean
  editable: boolean
  activeLabel: string
  inactiveLabel: string
  onToggle: (checked: boolean) => void
}

/**
 * A labelled on/off row. Edit mode shows the live Switch; view mode shows a
 * static dot + label (guide §7 — status is a static dot, not a live control).
 */
export function TrackToggleRow({ title, hint, checked, editable, activeLabel, inactiveLabel, onToggle }: TrackToggleRowProps) {
  const switchLabel = checked ? activeLabel : inactiveLabel
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <FieldLabel editable={editable}>{title}</FieldLabel>
        <FieldHint editable={editable} className="mt-0.5">
          {hint}
        </FieldHint>
      </div>
      {editable ? (
        <Switch checked={checked} size="sm" onChange={(e) => onToggle(e.target.checked)} label={switchLabel} />
      ) : (
        <span className="inline-flex items-center gap-1.75 text-sm font-medium text-ink-strong">
          <span className={cn('h-2 w-2 rounded-full', checked ? 'bg-success' : 'bg-stroke-strong')} />
          {switchLabel}
        </span>
      )}
    </div>
  )
}
