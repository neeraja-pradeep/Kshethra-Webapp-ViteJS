/** Pure ISO-date helpers shared by the schedule builder and date pickers. Local-time safe (noon anchor avoids DST/timezone rollover). */

/** Parse a `YYYY-MM-DD` string to a local Date at noon, or null if invalid/blank. */
export function parseISODate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const parts = String(iso).split('-')
  if (parts.length !== 3) return null
  const [y, m, d] = parts.map(Number)
  const date = new Date(y, m - 1, d, 12, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Format a Date back to `YYYY-MM-DD`. */
export function formatISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today, as `YYYY-MM-DD`. */
export function todayISO(): string {
  return formatISODate(new Date())
}

/** Add (or subtract) whole days to an ISO date string. */
export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso)
  if (!d) return iso
  d.setDate(d.getDate() + days)
  return formatISODate(d)
}

/** "Sat, 14 Feb 2026" — full weekday + date, used for specific/unavailable-date rows. */
export function humanDate(iso: string): string {
  const d = parseISODate(iso)
  if (!d) return iso || '—'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

/** "14 February" — day + full month, used for the yearly recurrence caption. */
export function monthDayText(iso: string): string {
  const d = parseISODate(iso)
  if (!d) return iso || '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

/** "14 Feb 2026" — compact date, used inside the recurrence summary sentence. */
export function shortDate(iso: string): string {
  const d = parseISODate(iso)
  if (!d) return iso || '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
