import { Badge, Icon } from '@/shared/ui'

import { DEVOTEE_STATUS_LABEL, type DevoteeStatus } from '@/features/devotees/domain/entities/devotee'
import { devoteeStatusColor } from '@/features/devotees/presentation/lib/badgeColors'

export interface DevoteeDetailHeaderProps {
  name: string
  status: DevoteeStatus | null
  onBack: () => void
}

/**
 * Sticky top bar for the devotee detail screen.
 *
 * No edit control: the account's contact details and family profiles are the
 * devotee's own to change in the app, and the back office has no endpoint that
 * writes either.
 */
export function DevoteeDetailHeader({ name, status, onBack }: DevoteeDetailHeaderProps) {
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
        <span className="truncate text-base font-semibold text-ink-strong">{name}</span>
      </div>
      {status && (
        <Badge color={devoteeStatusColor(status)} size="sm">
          {DEVOTEE_STATUS_LABEL[status]}
        </Badge>
      )}
    </div>
  )
}
