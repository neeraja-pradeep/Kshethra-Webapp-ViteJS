import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { addDays, buildMonthCells, formatChipDate, monthTitle, parseISO, todayISO, WEEKDAY_LETTERS } from '@/features/bookings/presentation/lib/date'

export type BookingDateMode = 'single' | 'range'

export interface BookingDateFilterProps {
  mode: BookingDateMode
  onModeChange: (mode: BookingDateMode) => void
  singleDate: string
  onSingleDateChange: (iso: string) => void
  rangeFrom: string
  rangeTo: string
  onRangeChange: (from: string, to: string) => void
}

/**
 * Filter-row date chip + popover calendar (Day / Range toggle, presets,
 * month nav, 7-column weekday grid). Mirrors the prototype's shared date
 * picker used above the bookings table.
 */
export function BookingDateFilter({ mode, onModeChange, singleDate, onSingleDateChange, rangeFrom, rangeTo, onRangeChange }: BookingDateFilterProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const d = parseISO(mode === 'range' ? rangeFrom : singleDate) ?? new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [pendingStart, setPendingStart] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const today = todayISO()
  const chipLabel =
    mode === 'single'
      ? singleDate === today
        ? `Today · ${formatChipDate(singleDate)}`
        : formatChipDate(singleDate)
      : `${formatChipDate(rangeFrom)} – ${formatChipDate(rangeTo)}`

  function openPopover() {
    const ref = mode === 'range' ? rangeFrom || today : singleDate || today
    const d = parseISO(ref) ?? new Date()
    setView({ y: d.getFullYear(), m: d.getMonth() })
    setPendingStart(null)
    setOpen(true)
  }

  function navMonth(delta: number) {
    setView((v) => {
      let m = v.m + delta
      let y = v.y
      if (m < 0) {
        m = 11
        y -= 1
      } else if (m > 11) {
        m = 0
        y += 1
      }
      return { y, m }
    })
  }

  function pickDay(iso: string) {
    if (mode === 'single') {
      onSingleDateChange(iso)
      setOpen(false)
      return
    }
    if (!pendingStart) {
      setPendingStart(iso)
      return
    }
    const [a, b] = pendingStart <= iso ? [pendingStart, iso] : [iso, pendingStart]
    onRangeChange(a, b)
    setPendingStart(null)
    setOpen(false)
  }

  function applyPreset(preset: 'today' | 'next7' | 'month') {
    if (preset === 'today') {
      onModeChange('single')
      onSingleDateChange(today)
    } else if (preset === 'next7') {
      onModeChange('range')
      onRangeChange(today, addDays(today, 6))
    } else {
      onModeChange('range')
      const d = parseISO(today) ?? new Date()
      const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      const last = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      onRangeChange(first, last)
    }
    setOpen(false)
  }

  const cells = buildMonthCells(view.y, view.m)
  const isRange = mode === 'range'
  const rangeStart = isRange ? pendingStart ?? rangeFrom : ''
  const rangeEnd = isRange ? (pendingStart ? '' : rangeTo) : ''

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={openPopover}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-md border-none bg-card px-3 text-sm font-medium text-ink shadow-xs hover:bg-hover"
      >
        <Icon name="calendar-blank" size={15} color="var(--color-primary)" />
        {chipLabel}
        <Icon name="caret-down" size={12} color="var(--text-subtle)" />
      </button>

      {open && (
        <>
          <div aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-drawer" />
          <div
            role="dialog"
            aria-label="Choose date"
            className="absolute left-0 top-9.5 z-menu flex w-[308px] max-w-full flex-col gap-2.75 rounded-2xl bg-card p-3.5 shadow-lg"
          >
            <div className="flex gap-1 rounded-lg bg-active p-0.75">
              <button
                type="button"
                onClick={() => onModeChange('single')}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.25 text-xs font-medium',
                  !isRange ? 'bg-card text-ink-strong shadow-xs' : 'bg-transparent text-ink-muted',
                )}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => onModeChange('range')}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.25 text-xs font-medium',
                  isRange ? 'bg-card text-ink-strong shadow-xs' : 'bg-transparent text-ink-muted',
                )}
              >
                Range
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Today', preset: 'today' as const },
                { label: 'Next 7 days', preset: 'next7' as const },
                { label: 'This month', preset: 'month' as const },
              ].map((p) => (
                <button
                  key={p.preset}
                  type="button"
                  onClick={() => applyPreset(p.preset)}
                  className="rounded-full border-none bg-primary-subtle px-2.75 py-1.25 text-xs font-medium text-primary-subtle-text hover:bg-primary-subtle-hover"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous month" onClick={() => navMonth(-1)} className="flex h-7 w-7 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover">
                <Icon name="caret-left" size={14} />
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-ink-strong">{monthTitle(view.y, view.m)}</span>
              <button type="button" aria-label="Next month" onClick={() => navMonth(1)} className="flex h-7 w-7 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover">
                <Icon name="caret-right" size={14} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {WEEKDAY_LETTERS.map((dw, i) => (
                <span key={i} className="inline-flex h-5.5 items-center justify-center text-2xs font-semibold tracking-wide text-ink-subtle">
                  {dw}
                </span>
              ))}
              {cells.map((c, i) => {
                if (c.blank) return <span key={i} className="h-8" />
                const isSel = isRange ? c.iso === rangeStart || c.iso === rangeEnd : !isRange && c.iso === singleDate
                const inR = isRange && rangeStart && rangeEnd && c.iso > rangeStart && c.iso < rangeEnd
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickDay(c.iso)}
                    aria-label={c.aria}
                    className={cn(
                      'h-8 rounded-md border-none text-sm tabular-nums',
                      isSel ? 'bg-primary text-white font-semibold' : inR ? 'bg-primary-subtle text-primary-subtle-text' : 'bg-transparent text-ink hover:bg-hover',
                      c.isToday && !isSel && 'shadow-[inset_0_0_0_1.5px_var(--color-primary-border)]',
                      c.isToday && !isSel && 'font-semibold',
                    )}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>

            {isRange && (
              <div className="flex items-center gap-1.5 text-2xs text-ink-subtle">
                <Icon name="info" size={13} />
                {pendingStart ? 'Now pick an end date' : 'Pick a start date, then an end date'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
