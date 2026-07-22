/** Format an ISO `YYYY-MM-DD` date as "1 Jul 2026" (en-IN). Invalid input passes through. */
export function formatDisplayDate(iso: string): string {
  const parts = iso.split('-')
  if (parts.length < 3) return iso
  const [y, m, d] = parts.map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
