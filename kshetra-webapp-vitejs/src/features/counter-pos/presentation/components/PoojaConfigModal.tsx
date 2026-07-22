import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Button, Icon, Textarea } from '@/shared/ui'

import type { BookingPerson } from '@/features/counter-pos/domain/entities/booking'
import { formatDateFull } from '@/features/counter-pos/presentation/lib/date'
import { MonthCalendar } from './MonthCalendar'

export interface PoojaConfigModalProps {
  open: boolean
  isEdit: boolean
  poojaName: string
  godName: string
  base: number
  namedPeople: readonly BookingPerson[]
  selectedPersonIds: ReadonlySet<string>
  onTogglePerson: (id: string) => void
  dates: readonly string[]
  onToggleDate: (iso: string) => void
  calYear: number
  calMonth: number
  onPrevMonth: () => void
  onNextMonth: () => void
  remarks: string
  onRemarksChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}

/** Add-pooja-to-booking / edit-pooja-line dialog: people, dates (calendar), remarks. */
export function PoojaConfigModal({
  open,
  isEdit,
  poojaName,
  godName,
  base,
  namedPeople,
  selectedPersonIds,
  onTogglePerson,
  dates,
  onToggleDate,
  calYear,
  calMonth,
  onPrevMonth,
  onNextMonth,
  remarks,
  onRemarksChange,
  onClose,
  onSave,
}: PoojaConfigModalProps) {
  if (!open) return null

  const peopleCount = namedPeople.filter((p) => selectedPersonIds.has(p.id)).length
  const datesCount = dates.length
  const total = base * peopleCount * datesCount
  const saveDisabled = peopleCount === 0 || datesCount === 0
  const mathLine = `${formatINR(base)} × ${peopleCount} ${peopleCount === 1 ? 'person' : 'people'} × ${datesCount} ${datesCount === 1 ? 'date' : 'dates'}`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay p-6 [backdrop-filter:blur(2px)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit pooja' : 'Add pooja to booking'}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[86vh] w-[520px] max-w-full flex-col overflow-hidden rounded-3xl bg-card shadow-xl"
      >
        <div className="flex flex-shrink-0 items-start gap-3 border-b border-stroke px-5.5 pb-3.5 pt-4.5">
          <span className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-text">
            <Icon name="flame" size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold text-ink-strong">{poojaName}</div>
            <div className="text-xs text-ink-subtle">
              {godName} · base {formatINR(base)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4.5 overflow-y-auto px-5.5 py-4">
          <div className="flex flex-col gap-2.25">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink">Who is this pooja for?</span>
              <span className="text-2xs text-ink-subtle">all selected by default</span>
            </div>
            {namedPeople.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-warning-border bg-warning-surface px-3 py-2.5 text-xs text-ink">
                <Icon name="warning-circle" size={15} className="text-warning" />
                Add at least one named person in the roster first.
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {namedPeople.map((p) => {
                const selected = selectedPersonIds.has(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onTogglePerson(p.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full py-1.75 pl-2.25 pr-3 text-sm font-medium',
                      selected ? 'bg-primary-subtle text-primary-subtle-text ring-2 ring-inset ring-primary' : 'bg-card text-ink ring-1 ring-inset ring-stroke-strong',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-sm text-white',
                        selected ? 'bg-primary' : 'bg-transparent ring-[1.5px] ring-inset ring-stroke-strong',
                      )}
                    >
                      {selected && <Icon name="check" weight="fill" size={12} />}
                    </span>
                    {p.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink">On which dates?</span>
              <span className="text-2xs text-ink-subtle">Click days to select multiple</span>
            </div>
            <MonthCalendar year={calYear} month={calMonth} selectedDates={dates} onToggleDate={onToggleDate} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} />
            {dates.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dates
                  .slice()
                  .sort()
                  .map((d) => (
                    <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle py-1.25 pl-2.75 pr-1.5 text-xs font-medium text-primary-subtle-text">
                      <Icon name="calendar-blank" size={12} />
                      {formatDateFull(d)}
                      <button type="button" onClick={() => onToggleDate(d)} aria-label="Remove date" className="inline-flex border-none bg-transparent p-0.5 text-inherit opacity-60 hover:opacity-100">
                        <Icon name="x" size={11} />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink">Remarks</span>
              <span className="text-2xs text-ink-subtle">optional — prints on the receipt</span>
            </div>
            <Textarea rows={2} placeholder="Any special instructions for this pooja…" value={remarks} onChange={(e) => onRemarksChange(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3 border-t border-stroke bg-sunken px-5.5 py-3.5">
          <div className="min-w-0 flex-1 text-xs text-ink-subtle">{mathLine}</div>
          <span className="text-lg font-bold tabular-nums text-ink-strong">{formatINR(total)}</span>
          <Button theme="primary" disabled={saveDisabled} onClick={onSave} iconLeft={<Icon name="check" size={16} />}>
            {isEdit ? 'Save changes' : 'Add to booking'}
          </Button>
        </div>
      </div>
    </div>
  )
}
