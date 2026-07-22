import { formatINR } from '@/shared/lib/format'

/** ISO yyyy-mm-dd → "1 Jul 2026". */
export function formatOrderDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Revenue KPI: lakh-abbreviated above ₹1,00,000, plain ₹ grouping below. */
export function formatRevenue(amount: number): string {
  if (amount >= 100000) {
    const lakh = (amount / 100000).toFixed(2).replace(/\.00$/, '')
    return `₹${lakh}L`
  }
  return formatINR(amount)
}

/** Strips everything but digits, so "+91 98470 30011" and "9847030011" both match. */
export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

/** A stable "recorded just now" timestamp for refund-log entries created during this session. */
export function nowStamp(): string {
  const d = new Date()
  return (
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  )
}
