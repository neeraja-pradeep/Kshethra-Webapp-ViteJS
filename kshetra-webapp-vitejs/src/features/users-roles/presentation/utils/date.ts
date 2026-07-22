/** Pure date helpers (Indian conventions), scoped to the Users & Roles feature. */

/** "2024-06-27" → "27 Jun 2024". Falls back to the raw input if unparsable. */
export function formatDisplayDate(iso: string): string {
  const parts = iso.split('-')
  if (parts.length < 3) return iso
  const [y, m, d] = parts.map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Today as an ISO "YYYY-MM-DD" string, for stamping created/modified audit fields. */
export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
