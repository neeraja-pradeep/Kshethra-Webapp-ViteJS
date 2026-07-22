import { useState } from 'react'

import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import type { OrderDateMode } from '@/features/orders/presentation/lib/orderFilters'

export interface OrdersDateFilterProps {
  mode: OrderDateMode
  date: string
  from: string
  to: string
  onModeChange: (mode: OrderDateMode) => void
  onDateChange: (iso: string) => void
  onFromChange: (iso: string) => void
  onToChange: (iso: string) => void
  onAllDates: () => void
  onToday: () => void
  onNext7Days: () => void
  onThisMonth: () => void
}

function chipLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Date-range filter: "All dates" chip that opens a Day/Range popover with quick presets. */
export function OrdersDateFilter(props: OrdersDateFilterProps) {
  const [open, setOpen] = useState(false)
  const todayIso = new Date().toISOString().slice(0, 10)

  const label =
    props.mode === 'all'
      ? 'All dates'
      : props.mode === 'single'
        ? props.date === todayIso
          ? `Today · ${chipLabel(props.date)}`
          : chipLabel(props.date)
        : `${chipLabel(props.from)} – ${chipLabel(props.to)}`

  const preset = (presetLabel: string, onClick: () => void) => (
    <button
      key={presetLabel}
      type="button"
      onClick={() => {
        onClick()
        if (presetLabel === 'All dates') setOpen(false)
      }}
      className="rounded-full border-none bg-primary-subtle px-2.75 py-1.25 font-sans text-2xs font-medium text-primary-subtle-text hover:bg-primary-subtle-hover"
    >
      {presetLabel}
    </button>
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-md border-none bg-card px-3 font-sans text-sm font-medium text-ink shadow-xs hover:bg-hover"
      >
        <Icon name="calendar-blank" size={15} color="var(--color-primary)" />
        {label}
        <Icon name="caret-down" size={12} className="text-ink-subtle" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-label="Choose date" className="absolute left-0 top-[38px] z-[56] flex w-[308px] flex-col gap-2.75 rounded-2xl bg-card p-3.5 shadow-lg">
            <div className="flex gap-1 rounded-lg bg-active p-0.75">
              <button
                type="button"
                onClick={() => props.onModeChange('single')}
                className={cn(
                  'flex-1 rounded-md border-none px-3 py-1.25 font-sans text-xs font-medium',
                  props.mode !== 'range' ? 'bg-card text-ink-strong shadow-xs' : 'bg-transparent text-ink-muted',
                )}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => props.onModeChange('range')}
                className={cn(
                  'flex-1 rounded-md border-none px-3 py-1.25 font-sans text-xs font-medium',
                  props.mode === 'range' ? 'bg-card text-ink-strong shadow-xs' : 'bg-transparent text-ink-muted',
                )}
              >
                Range
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {preset('Today', props.onToday)}
              {preset('Next 7 days', props.onNext7Days)}
              {preset('This month', props.onThisMonth)}
              {preset('All dates', props.onAllDates)}
            </div>

            {props.mode === 'range' ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={props.from}
                  onChange={(e) => props.onFromChange(e.target.value)}
                  className="h-8.5 flex-1 rounded-md border-none bg-card px-2.5 font-sans text-sm text-ink shadow-xs"
                />
                <span className="text-ink-subtle">→</span>
                <input
                  type="date"
                  value={props.to}
                  onChange={(e) => props.onToChange(e.target.value)}
                  className="h-8.5 flex-1 rounded-md border-none bg-card px-2.5 font-sans text-sm text-ink shadow-xs"
                />
              </div>
            ) : (
              <input
                type="date"
                value={props.date}
                onChange={(e) => props.onDateChange(e.target.value)}
                className="h-8.5 rounded-md border-none bg-card px-2.5 font-sans text-sm text-ink shadow-xs"
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
