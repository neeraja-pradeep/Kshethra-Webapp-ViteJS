/** Pure date helpers for the counter POS flow (ISO yyyy-mm-dd in, display strings out). */

/** Today as an ISO (yyyy-mm-dd) date, in local time. */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "22 Jul 2026" — today's display date. */
export function todayDisplay(): string {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Add `n` days to an ISO date, returning a new ISO date. */
export function addDaysISO(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "22 Jul" — short display date, used on booking-line date chips. */
export function formatDateShort(iso: string): string {
  if (iso.split('-').length < 3) return iso
  return parseISO(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** "22 Jul 2026" — full display date, used on config-modal date chips and receipts. */
export function formatDateFull(iso: string): string {
  if (iso.split('-').length < 3) return iso
  return parseISO(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "11:32 am" — current time, lower-cased to match the receipt style. */
export function nowTimeDisplay(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

export interface CalendarCell {
  readonly key: string
  readonly blank: boolean
  /** ISO date; only meaningful when `blank` is false. */
  readonly iso: string
  readonly day: number
  readonly isPast: boolean
  readonly isToday: boolean
}

/** Builds the (leading blanks + numbered days) grid cells for one calendar month. */
export function buildCalendarCells(year: number, month: number): readonly CalendarCell[] {
  const first = new Date(year, month, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = todayISO()
  const cells: CalendarCell[] = []

  for (let i = 0; i < startDow; i++) {
    cells.push({ key: `b${i}`, blank: true, iso: '', day: 0, isPast: false, isToday: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ key: iso, blank: false, iso, day, isPast: iso < today, isToday: iso === today })
  }
  return cells
}

/** "July 2026" — calendar header label. */
export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}
