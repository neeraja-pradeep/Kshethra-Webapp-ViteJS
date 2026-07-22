/** Small date helpers — ISO (yyyy-mm-dd) in, en-IN display strings out. */

export function todayISO(): string {
  return isoOf(new Date())
}

export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const [, y, mo, d] = m
  return new Date(Number(y), Number(mo) - 1, Number(d))
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso) ?? new Date()
  d.setDate(d.getDate() + days)
  return isoOf(d)
}

/** "1 Jul" — used on the filter chip and range endpoints. */
export function formatChipDate(iso: string): string {
  const d = parseISO(iso)
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : iso
}

/** "1 Jul 2026" — used in the table and detail drawer. */
export function formatFullDate(iso: string): string {
  const d = parseISO(iso)
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : iso
}

export interface MonthDayCell {
  readonly blank: false
  readonly iso: string
  readonly label: string
  readonly aria: string
  readonly isToday: boolean
}
export interface MonthBlankCell {
  readonly blank: true
}
export type MonthCell = MonthDayCell | MonthBlankCell

/** Weekday-aligned month grid: leading blanks + one cell per day. */
export function buildMonthCells(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = todayISO()
  const cells: MonthCell[] = []
  for (let i = 0; i < startDow; i++) cells.push({ blank: true })
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      blank: false,
      iso,
      label: String(day),
      aria: new Date(year, month, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      isToday: iso === today,
    })
  }
  return cells
}

export function monthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export const WEEKDAY_LETTERS: readonly string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
