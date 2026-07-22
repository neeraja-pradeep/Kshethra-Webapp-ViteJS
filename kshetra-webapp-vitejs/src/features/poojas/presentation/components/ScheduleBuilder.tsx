import type { ReactNode } from 'react'

import { Select } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import type { PoojaSchedule } from '../../domain/entities/pooja'
import { monthDayText } from '../lib/dateUtils'
import { ORDINALS, WEEKDAYS_FULL, WEEKDAYS_SHORT } from '../lib/scheduleLogic'

const FREQ_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
]
// The domain model's CustomUnit only covers weeks/months (see PoojaSchedule).
const CUSTOM_UNIT_OPTIONS = [
  { value: 'weeks', label: 'weeks' },
  { value: 'months', label: 'months' },
]
const ORDINAL_OPTIONS = ORDINALS
const WEEKDAY_FULL_OPTIONS = WEEKDAYS_FULL.map((w, i) => ({ value: String(i), label: w }))

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md border-none px-2.5 py-2 text-xs font-medium',
        active ? 'bg-primary-subtle text-primary-subtle-text shadow-[inset_0_0_0_1px_var(--color-primary-border)]' : 'bg-sunken text-ink-muted shadow-[inset_0_0_0_1px_var(--border-subtle)]',
      )}
    >
      {children}
    </button>
  )
}

export interface ScheduleBuilderProps {
  schedule: PoojaSchedule
  error?: string
  onChange: <K extends keyof PoojaSchedule>(key: K, value: PoojaSchedule[K]) => void
  onToggleWeekday: (idx: number) => void
}

/** Recurring-availability editor: frequency, weekday/monthly/custom controls, and the start/end rule. */
export function ScheduleBuilder({ schedule: sc, error, onChange, onToggleWeekday }: ScheduleBuilderProps) {
  const freq = sc.frequency
  const showWeekdayChips = freq === 'weekly' || (freq === 'custom' && sc.customUnit === 'weeks')
  const showMonthlyControls = freq === 'monthly' || (freq === 'custom' && sc.customUnit === 'months')
  const showCustom = freq === 'custom'
  const showYearly = freq === 'yearly'
  const showRecurringDetails = freq !== 'none'

  return (
    <div className="flex flex-col gap-2.75">
      <Select label="Frequency" options={FREQ_OPTIONS} value={freq} onChange={(e) => onChange('frequency', e.target.value as PoojaSchedule['frequency'])} />

      {showWeekdayChips && (
        <div className="flex flex-col gap-1.75">
          <div className="text-sm font-medium text-ink">On these days</div>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS_SHORT.map((label, idx) => {
              const active = sc.weekdays.includes(idx)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onToggleWeekday(idx)}
                  className={cn(
                    'min-w-11 rounded-md border-none px-2.5 py-1.75 text-xs font-medium',
                    active ? 'bg-primary-subtle text-primary-subtle-text shadow-[inset_0_0_0_1px_var(--color-primary-border)]' : 'bg-sunken text-ink-muted shadow-[inset_0_0_0_1px_var(--border-subtle)]',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showMonthlyControls && (
        <div className="flex flex-col gap-2.25">
          <div className="flex gap-1.5">
            <Seg active={sc.monthlyMode === 'dom'} onClick={() => onChange('monthlyMode', 'dom')}>
              Day of month
            </Seg>
            <Seg active={sc.monthlyMode === 'dow'} onClick={() => onChange('monthlyMode', 'dow')}>
              Day of week
            </Seg>
          </div>
          {sc.monthlyMode === 'dom' && (
            <div className="flex items-center gap-2 text-sm text-ink">
              <span>Day</span>
              <input
                type="number"
                min={1}
                max={31}
                value={sc.monthlyDom}
                onChange={(e) => onChange('monthlyDom', e.target.value)}
                className="h-8.5 w-[74px] rounded-md border-none bg-card px-2.5 font-sans text-base text-ink shadow-xs"
              />
              <span>of the month</span>
            </div>
          )}
          {sc.monthlyMode === 'dow' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink">The</span>
              <div className="flex-1">
                <Select options={ORDINAL_OPTIONS} value={sc.monthlyOrdinal} onChange={(e) => onChange('monthlyOrdinal', e.target.value)} />
              </div>
              <div className="flex-[1.4]">
                <Select options={WEEKDAY_FULL_OPTIONS} value={String(sc.monthlyWeekday)} onChange={(e) => onChange('monthlyWeekday', Number(e.target.value))} />
              </div>
            </div>
          )}
        </div>
      )}

      {showCustom && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink">Every</span>
          <input
            type="number"
            min={1}
            value={sc.customInterval}
            onChange={(e) => onChange('customInterval', e.target.value)}
            className="h-8.5 w-[74px] rounded-md border-none bg-card px-2.5 font-sans text-base text-ink shadow-xs"
          />
          <div className="flex-1">
            <Select options={CUSTOM_UNIT_OPTIONS} value={sc.customUnit} onChange={(e) => onChange('customUnit', e.target.value as PoojaSchedule['customUnit'])} />
          </div>
        </div>
      )}

      {showYearly && <div className="rounded-md border border-stroke-subtle bg-sunken px-3 py-2.25 text-sm text-ink-muted">Repeats every year on {monthDayText(sc.startDate)}.</div>}

      {showRecurringDetails && (
        <div className="flex flex-wrap items-start gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Starts on</span>
            <input
              type="date"
              value={sc.startDate}
              onChange={(e) => onChange('startDate', e.target.value)}
              className="h-8.5 rounded-md border-none bg-card px-2.5 font-sans text-base text-ink shadow-xs"
            />
          </div>
          <div className="flex min-w-60 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Ends</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChange('endMode', 'never')}
                className={cn(
                  'rounded-md border-none px-3 py-1.75 text-xs font-medium',
                  sc.endMode === 'never' ? 'bg-primary-subtle text-primary-subtle-text shadow-[inset_0_0_0_1px_var(--color-primary-border)]' : 'bg-sunken text-ink-muted shadow-[inset_0_0_0_1px_var(--border-subtle)]',
                )}
              >
                Never
              </button>
              <button
                type="button"
                onClick={() => onChange('endMode', 'on')}
                className={cn(
                  'rounded-md border-none px-3 py-1.75 text-xs font-medium',
                  sc.endMode === 'on' ? 'bg-primary-subtle text-primary-subtle-text shadow-[inset_0_0_0_1px_var(--color-primary-border)]' : 'bg-sunken text-ink-muted shadow-[inset_0_0_0_1px_var(--border-subtle)]',
                )}
              >
                On date
              </button>
              <button
                type="button"
                onClick={() => onChange('endMode', 'after')}
                className={cn(
                  'rounded-md border-none px-3 py-1.75 text-xs font-medium',
                  sc.endMode === 'after' ? 'bg-primary-subtle text-primary-subtle-text shadow-[inset_0_0_0_1px_var(--color-primary-border)]' : 'bg-sunken text-ink-muted shadow-[inset_0_0_0_1px_var(--border-subtle)]',
                )}
              >
                After N
              </button>
              {sc.endMode === 'on' && (
                <input
                  type="date"
                  value={sc.endDate}
                  onChange={(e) => onChange('endDate', e.target.value)}
                  className="h-8 rounded-md border-none bg-card px-2.5 font-sans text-sm text-ink shadow-xs"
                />
              )}
              {sc.endMode === 'after' && (
                <>
                  <input
                    type="number"
                    min={1}
                    value={sc.endCount}
                    onChange={(e) => onChange('endCount', e.target.value)}
                    className="h-8 w-16 rounded-md border-none bg-card px-2.5 font-sans text-sm text-ink shadow-xs"
                  />
                  <span className="text-xs text-ink-muted">occurrences</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-xs text-danger">{error}</div>}
    </div>
  )
}
