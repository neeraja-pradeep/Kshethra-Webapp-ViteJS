/** Parse a "yyyy-mm-dd" string as a local-midnight Date (avoids UTC shift). */
function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

/** Short weekday, e.g. "Wed". */
export function formatWeekdayShort(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-IN', { weekday: 'short' })
}

/** Day-of-month + short month, e.g. "22 Jul". */
export function formatDayMonth(iso: string): string {
  const date = parseISODate(iso)
  return `${date.getDate()} ${date.toLocaleDateString('en-IN', { month: 'short' })}`
}

/** Full date line for the dashboard header, e.g. "Wednesday, 22 July 2026". */
export function formatDashboardDateLine(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
