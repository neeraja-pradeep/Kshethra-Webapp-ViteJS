import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui'

import { buildCalendarCells, monthLabel } from '@/features/counter-pos/presentation/lib/date'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export interface MonthCalendarProps {
  year: number
  /** 0-based month index. */
  month: number
  selectedDates: readonly string[]
  onToggleDate: (iso: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

/** Single-month calendar grid — click days to select multiple booking dates. */
export function MonthCalendar({ year, month, selectedDates, onToggleDate, onPrevMonth, onNextMonth }: MonthCalendarProps) {
  const cells = buildCalendarCells(year, month)

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-active p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Previous month"
          className="flex h-7.5 w-7.5 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs hover:bg-hover"
        >
          <Icon name="caret-left" size={14} />
        </button>
        <span className="text-sm font-semibold text-ink-strong">{monthLabel(year, month)}</span>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
          className="flex h-7.5 w-7.5 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs hover:bg-hover"
        >
          <Icon name="caret-right" size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.75">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-0.5 text-center text-2xs font-semibold text-ink-subtle">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.75">
        {cells.map((c) => {
          if (c.blank) return <span key={c.key} />
          const selected = selectedDates.includes(c.iso)
          return (
            <button
              key={c.key}
              type="button"
              disabled={c.isPast}
              onClick={() => onToggleDate(c.iso)}
              className={cn(
                'inline-flex h-8.5 items-center justify-center rounded-md border-none text-sm tabular-nums',
                c.isPast && 'cursor-default bg-transparent text-ink-subtle opacity-40',
                !c.isPast && !selected && 'cursor-pointer bg-transparent text-ink hover:bg-hover',
                !c.isPast && selected && 'cursor-pointer bg-primary font-semibold text-white',
                !c.isPast && !selected && c.isToday && 'font-semibold ring-2 ring-inset ring-primary-border',
              )}
            >
              {c.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
