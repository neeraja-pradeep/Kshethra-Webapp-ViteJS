import { useEffect, useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui'

import { todayISO } from '../lib/storeFormat'

export type DateFilterMode = 'single' | 'range'
export type DatePreset = 'today' | 'next7' | 'month'

export interface DateRangeMenuProps {
  mode: DateFilterMode
  date: string
  from: string
  to: string
  onModeChange: (mode: DateFilterMode) => void
  onPickSingle: (iso: string) => void
  onPickRange: (from: string, to: string) => void
  onPreset: (kind: DatePreset) => void
}

function parseISO(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** Order-list date filter: a chip that opens a Day/Range calendar popover. */
export function DateRangeMenu({ mode, date, from, to, onModeChange, onPickSingle, onPickRange, onPreset }: DateRangeMenuProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<{ y: number; m: number }>(() => {
    const seed = parseISO(mode === 'range' ? from : date) ?? new Date()
    return { y: seed.getFullYear(), m: seed.getMonth() }
  })
  const [pending, setPending] = useState<string | null>(null)

  const openMenu = () => {
    const seed = parseISO(mode === 'range' ? from : date) ?? new Date()
    setView({ y: seed.getFullYear(), m: seed.getMonth() })
    setPending(null)
    setOpen(true)
  }

  const nav = (delta: number) => {
    setView((v) => {
      let m = v.m + delta
      let y = v.y
      if (m < 0) {
        m = 11
        y -= 1
      }
      if (m > 11) {
        m = 0
        y += 1
      }
      return { y, m }
    })
  }

  const pick = (iso: string) => {
    if (mode !== 'range') {
      onPickSingle(iso)
      setOpen(false)
      return
    }
    if (!pending) {
      onPickRange(iso, iso)
      setPending(iso)
      return
    }
    const a = pending < iso ? pending : iso
    const b = pending < iso ? iso : pending
    onPickRange(a, b)
    setPending(null)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const today = todayISO()
  const first = new Date(view.y, view.m, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const days: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const fmtShort = (iso: string) => parseISO(iso)?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) ?? iso
  const chipLabel = mode === 'single' ? (date === today ? `Today · ${fmtShort(date)}` : fmtShort(date)) : `${fmtShort(from)} – ${fmtShort(to)}`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-md border-none bg-card px-3 font-sans text-sm font-medium text-ink shadow-xs hover:bg-hover"
      >
        <Icon name="calendar-blank" size={15} className="text-primary" />
        {chipLabel}
        <Icon name="caret-down" size={12} className="text-ink-subtle" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[55]" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Choose date"
            className="absolute left-0 top-[38px] z-[56] flex w-[308px] flex-col gap-2.75 rounded-2xl bg-card p-3.5 shadow-lg"
          >
            <div className="flex gap-1 rounded-lg bg-active p-0.75">
              <button
                type="button"
                onClick={() => onModeChange('single')}
                className={cn(
                  'flex-1 rounded-md border-none px-3 py-1.25 font-sans text-xs font-medium',
                  mode === 'single' ? 'bg-card text-ink-strong shadow-xs' : 'bg-transparent text-ink-muted',
                )}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => onModeChange('range')}
                className={cn(
                  'flex-1 rounded-md border-none px-3 py-1.25 font-sans text-xs font-medium',
                  mode === 'range' ? 'bg-card text-ink-strong shadow-xs' : 'bg-transparent text-ink-muted',
                )}
              >
                Range
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['today', 'Today'],
                  ['next7', 'Next 7 days'],
                  ['month', 'This month'],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    onPreset(kind)
                    setOpen(false)
                  }}
                  className="rounded-full border-none bg-primary-subtle px-2.75 py-1.25 font-sans text-xs font-medium text-primary-subtle-text hover:bg-primary-subtle-hover"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => nav(-1)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover"
              >
                <Icon name="caret-left" size={14} />
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-ink-strong">
                {first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => nav(1)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover"
              >
                <Icon name="caret-right" size={14} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {DOW.map((dw, i) => (
                <span key={i} className="inline-flex h-5.5 items-center justify-center text-2xs font-semibold tracking-wide text-ink-subtle">
                  {dw}
                </span>
              ))}
              {Array.from({ length: startDow }).map((_, i) => (
                <span key={`b${i}`} className="h-8" />
              ))}
              {days.map((d) => {
                const iso = `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const isToday = iso === today
                const isSel = mode === 'range' ? iso === from || iso === to : iso === date
                const inRange = mode === 'range' && !!from && !!to && iso > from && iso < to
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => pick(iso)}
                    aria-label={parseISO(iso)?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    className={cn(
                      'h-8 rounded-md border-none font-sans text-sm tabular-nums',
                      isSel
                        ? 'bg-primary font-semibold text-white'
                        : inRange
                          ? 'bg-primary-subtle text-primary-subtle-text'
                          : cn('bg-transparent text-ink hover:bg-hover', isToday && 'font-semibold ring-1 ring-inset ring-primary-border'),
                    )}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
            {mode === 'range' && (
              <div className="flex items-center gap-1.5 text-2xs text-ink-subtle">
                <Icon name="info" size={13} />
                {pending ? 'Now pick an end date' : 'Pick a start date, then an end date'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
