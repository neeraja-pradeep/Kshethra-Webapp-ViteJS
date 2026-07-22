import type { MonthlyMode, PoojaSchedule, SpecificDate, UnavailableRange } from '../../domain/entities/pooja'
import { formatISODate, monthDayText, parseISODate, shortDate } from './dateUtils'

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const ORDINALS = [
  { value: 'first', label: 'first' },
  { value: 'second', label: 'second' },
  { value: 'third', label: 'third' },
  { value: 'fourth', label: 'fourth' },
  { value: 'last', label: 'last' },
]

/** A fresh recurring-schedule rule seeded from a start date, matching the design's defaults. */
export function blankSchedule(startISO: string): PoojaSchedule {
  const d = parseISODate(startISO) ?? new Date()
  return {
    frequency: 'none',
    weekdays: [],
    monthlyMode: 'dom',
    monthlyDom: String(d.getDate()),
    monthlyOrdinal: 'first',
    monthlyWeekday: d.getDay(),
    customInterval: '1',
    customUnit: 'weeks',
    startDate: startISO || formatISODate(d),
    endMode: 'never',
    endDate: '',
    endCount: '10',
  }
}

/** Plain-language recurrence sentence, e.g. "Monthly on day 4 · from 5 Jan 2026". */
export function recurrenceSummaryText(sc: PoojaSchedule): string {
  const days = sc.weekdays.length ? sc.weekdays.map((i) => WEEKDAYS_SHORT[i]).join(', ') : ''
  const f = sc.frequency
  if (!f || f === 'none') return 'No recurring schedule — specific dates only.'
  let base: string
  if (f === 'daily') base = 'Daily'
  else if (f === 'weekly') base = 'Weekly' + (days ? ' on ' + days : '')
  else if (f === 'monthly')
    base =
      sc.monthlyMode === 'dow' ? `Monthly on the ${sc.monthlyOrdinal} ${WEEKDAYS_FULL[sc.monthlyWeekday]}` : `Monthly on day ${sc.monthlyDom}`
  else if (f === 'yearly') base = 'Yearly' + (sc.startDate ? ' on ' + monthDayText(sc.startDate) : '')
  else if (f === 'custom') base = `Every ${sc.customInterval || 1} ${sc.customUnit || 'weeks'}` + (days ? ' on ' + days : '')
  else base = f
  let out = base
  if (sc.startDate) out += ' · from ' + shortDate(sc.startDate)
  if (sc.endMode === 'on' && sc.endDate) out += ' · until ' + shortDate(sc.endDate)
  else if (sc.endMode === 'after' && sc.endCount) out += ' · ' + sc.endCount + ' occurrences'
  return out
}

/** The date within month (y, m) that a monthly rule lands on, or null if it doesn't occur that month. */
function monthlyDateFor(y: number, m: number, mode: MonthlyMode, dom: string, ordinal: string, weekday: number): Date | null {
  if (mode === 'dow') {
    const wd = Number(weekday) || 0
    if (ordinal === 'last') {
      const last = new Date(y, m + 1, 0, 12, 0, 0)
      const diff = (last.getDay() - wd + 7) % 7
      return new Date(y, m, last.getDate() - diff, 12, 0, 0)
    }
    const ordMap: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4 }
    const ord = ordMap[ordinal] ?? 1
    const first = new Date(y, m, 1, 12, 0, 0)
    const offset = (wd - first.getDay() + 7) % 7
    const day = 1 + offset + (ord - 1) * 7
    const dim = new Date(y, m + 1, 0).getDate()
    return day > dim ? null : new Date(y, m, day, 12, 0, 0)
  }
  const domN = Math.min(31, Math.max(1, Number(dom) || 1))
  const dim = new Date(y, m + 1, 0).getDate()
  return domN > dim ? null : new Date(y, m, domN, 12, 0, 0)
}

/** Every occurrence of a recurring rule from `fromISO`, capped at `limit` results within `horizonDays`. */
export function recurringOccurrences(schedule: PoojaSchedule | null, fromISO: string, limit: number, horizonDays: number): string[] {
  if (!schedule || schedule.frequency === 'none') return []
  const freq = schedule.frequency
  const start = parseISODate(schedule.startDate)
  if (!start) return []
  const from = parseISODate(fromISO) ?? start
  const horizon = new Date(Math.max(start.getTime(), from.getTime()))
  horizon.setDate(horizon.getDate() + horizonDays)
  const endOnDate = schedule.endMode === 'on' && schedule.endDate ? parseISODate(schedule.endDate) : null
  const endAfter = schedule.endMode === 'after' ? Math.max(1, Number(schedule.endCount) || 1) : null
  const cap = 1500
  let occ: string[] = []

  if (freq === 'daily') {
    const d = new Date(start)
    let n = 0
    while (d <= horizon && n < cap) {
      occ.push(formatISODate(d))
      d.setDate(d.getDate() + 1)
      n++
      if (endAfter && occ.length >= endAfter) break
    }
  } else if (freq === 'weekly' || (freq === 'custom' && schedule.customUnit === 'weeks')) {
    const wds = schedule.weekdays.length ? schedule.weekdays.slice() : [start.getDay()]
    const interval = freq === 'custom' ? Math.max(1, Number(schedule.customInterval) || 1) : 1
    const weekStart = new Date(start)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    let w = 0
    while (weekStart <= horizon && w < cap) {
      if (w % interval === 0) {
        wds.forEach((wd) => {
          const d = new Date(weekStart)
          d.setDate(d.getDate() + wd)
          if (d >= start && d <= horizon) occ.push(formatISODate(d))
        })
      }
      weekStart.setDate(weekStart.getDate() + 7)
      w++
    }
    occ.sort()
  } else if (freq === 'monthly' || (freq === 'custom' && schedule.customUnit === 'months')) {
    const interval = freq === 'custom' ? Math.max(1, Number(schedule.customInterval) || 1) : 1
    let y = start.getFullYear()
    let m = start.getMonth()
    let cnt = 0
    while (cnt < cap) {
      const d = monthlyDateFor(y, m, schedule.monthlyMode, schedule.monthlyDom, schedule.monthlyOrdinal, schedule.monthlyWeekday)
      if (d && d >= start && d <= horizon) occ.push(formatISODate(d))
      m += interval
      while (m > 11) {
        m -= 12
        y++
      }
      cnt++
      if (new Date(y, m, 1, 12, 0, 0) > horizon) break
    }
    occ.sort()
  } else if (freq === 'yearly') {
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear() + i, start.getMonth(), start.getDate(), 12, 0, 0)
      if (d >= start && d <= horizon) occ.push(formatISODate(d))
    }
    occ.sort()
  }

  if (endAfter) occ = occ.slice(0, endAfter)
  if (endOnDate) occ = occ.filter((iso) => (parseISODate(iso) ?? new Date(0)) <= endOnDate)
  return occ.filter((iso) => iso >= fromISO).slice(0, limit)
}

/** Next `count` bookable dates for a pooja: (recurring ∪ specific) − unavailable, non-special poojas are bookable every day. */
export function resolveBookable(
  special: boolean,
  schedule: PoojaSchedule | null,
  specificDates: readonly SpecificDate[],
  unavailable: readonly UnavailableRange[],
  fromISO: string,
  count: number,
): string[] {
  const horizonDays = 730
  const isBlocked = (iso: string) => unavailable.some((u) => iso >= u.start && iso <= (u.end || u.start))
  if (!special) {
    const out: string[] = []
    const cur = parseISODate(fromISO) ?? new Date()
    for (let i = 0; i < horizonDays && out.length < count; i++) {
      const iso = formatISODate(cur)
      if (!isBlocked(iso)) out.push(iso)
      cur.setDate(cur.getDate() + 1)
    }
    return out
  }
  const set = new Set<string>()
  recurringOccurrences(schedule, fromISO, count + 60, horizonDays).forEach((iso) => set.add(iso))
  specificDates.forEach((d) => {
    if (d.date) set.add(d.date)
  })
  return Array.from(set)
    .filter((iso) => iso >= fromISO && !isBlocked(iso))
    .sort()
    .slice(0, count)
}
