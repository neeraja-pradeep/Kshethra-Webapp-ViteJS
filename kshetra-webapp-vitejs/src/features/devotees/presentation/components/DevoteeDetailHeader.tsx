import { Badge, Button, Icon } from '@/shared/ui'

import type { Devotee } from '@/features/devotees/domain/entities/devotee'
import { devoteeStatusColor } from '@/features/devotees/presentation/lib/badgeColors'

export interface DevoteeDetailHeaderProps {
  devotee: Devotee
  editing: boolean
  onBack: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
}

/** Sticky top bar for the devotee detail screen: back, breadcrumb, status, edit controls. */
export function DevoteeDetailHeader({ devotee, editing, onBack, onEdit, onCancelEdit, onSave }: DevoteeDetailHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-stroke bg-card px-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="inline-flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover hover:text-ink-strong"
      >
        <Icon name="arrow-left" size={18} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-overline text-ink-subtle">App · Devotees</span>
        <span className="text-stroke-strong">/</span>
        <span className="whitespace-nowrap text-base font-semibold text-ink-strong">{devotee.name}</span>
      </div>
      <Badge color={devoteeStatusColor(devotee.status)} size="sm">
        {devotee.status}
      </Badge>
      {!editing && (
        <Button theme="default" variant="outline" size="sm" onClick={onEdit}>
          <Icon name="pencil-simple" size={14} />
          Edit details
        </Button>
      )}
      {editing && (
        <>
          <Button theme="default" variant="outline" size="sm" onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button theme="primary" size="sm" onClick={onSave}>
            <Icon name="check" size={14} />
            Save changes
          </Button>
        </>
      )}
    </div>
  )
}
