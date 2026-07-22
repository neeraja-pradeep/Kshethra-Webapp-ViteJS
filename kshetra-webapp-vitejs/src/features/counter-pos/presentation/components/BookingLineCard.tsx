import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Icon } from '@/shared/ui'

import type { BookingLine } from '@/features/counter-pos/domain/entities/booking'
import type { TransactionPerson } from '@/features/counter-pos/domain/entities/transaction'
import { formatDateShort } from '@/features/counter-pos/presentation/lib/date'

export interface BookingLineCardProps {
  line: BookingLine
  /** Named people this line currently resolves to (booking-roster people minus blanks). */
  people: readonly TransactionPerson[]
  onEdit: () => void
  onRemove: () => void
}

/** One configured pooja within the current walk-in booking — people, dates, and running total. */
export function BookingLineCard({ line, people, onEdit, onRemove }: BookingLineCardProps) {
  const flagged = people.length === 0
  const total = line.base * people.length * line.dates.length
  const mathLine = flagged
    ? 'Needs at least one person'
    : `${formatINR(line.base)} × ${people.length} ${people.length === 1 ? 'person' : 'people'} × ${line.dates.length} ${line.dates.length === 1 ? 'date' : 'dates'}`

  return (
    <div
      className={cn(
        'flex flex-col gap-2.25 rounded-lg bg-sunken p-3.25 ring-inset',
        flagged ? 'ring-2 ring-warning-border' : 'ring-1 ring-stroke-subtle',
      )}
    >
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink-strong">{line.name}</div>
          <div className="text-xs text-ink-subtle">{line.godName}</div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit pooja"
          title="Edit people & dates"
          className="flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-subtle hover:bg-hover hover:text-primary"
        >
          <Icon name="pencil-simple" size={15} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove pooja"
          className="flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-subtle hover:bg-danger-surface hover:text-danger"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>

      {flagged && (
        <div className="flex items-center gap-1.75 rounded-md border border-warning-border bg-warning-surface px-2.5 py-1.75 text-xs text-ink">
          <Icon name="warning-circle" size={14} className="flex-shrink-0 text-warning" />
          No people — edit to add, or remove this pooja.
        </div>
      )}

      {line.remarks.trim() && (
        <div className="flex items-start gap-1.75 text-xs leading-snug text-ink-muted">
          <Icon name="note-pencil" size={14} className="mt-px flex-shrink-0 text-ink-subtle" />
          {line.remarks}
        </div>
      )}

      {people.length > 0 && (
        <div className="flex flex-col gap-1.25">
          <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">For</span>
          <div className="flex flex-wrap gap-1.25">
            {people.map((p, i) => (
              <span key={`${p.name}-${i}`} className="inline-flex items-center gap-1.25 rounded-full bg-card px-2.25 py-0.75 text-xs shadow-xs">
                <span className="font-medium text-ink">{p.name}</span>
                {p.nakshatra && <span className="text-ink-subtle">{p.nakshatra}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.25">
        <span className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">Dates</span>
        <div className="flex flex-wrap gap-1.25">
          {line.dates.map((d) => (
            <span key={d} className="inline-flex items-center gap-1.25 rounded-full bg-primary-subtle px-2.25 py-0.75 text-xs font-medium text-primary-subtle-text">
              <Icon name="calendar-blank" size={12} />
              {formatDateShort(d)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 border-t border-stroke-subtle pt-2">
        <span className="text-2xs text-ink-subtle">{mathLine}</span>
        <span className="text-base font-bold tabular-nums text-ink-strong">{formatINR(total)}</span>
      </div>
    </div>
  )
}
