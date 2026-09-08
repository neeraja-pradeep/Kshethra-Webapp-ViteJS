import type { AgentCodeStatus, AgentCodeValidityState } from '@/features/agent-codes/domain/entities/agent-code'

/**
 * Display helpers.
 *
 * The wire values are lower-case (`active`), because that is what the API both
 * sends and accepts; the screen prints them capitalised. Converting in one
 * place is what stops a `.toUpperCase()` creeping into a request body.
 */

const STATUS_LABELS: Readonly<Record<AgentCodeStatus, string>> = {
  active: 'Active',
  inactive: 'Inactive',
}

const VALIDITY_LABELS: Readonly<Record<AgentCodeValidityState, string>> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
}

export function agentCodeStatusLabel(status: AgentCodeStatus): string {
  return STATUS_LABELS[status]
}

export function agentCodeValidityLabel(state: AgentCodeValidityState): string {
  return VALIDITY_LABELS[state]
}

/**
 * "1 Jun 26" from an ISO datetime, or an em dash when the bound is open.
 *
 * Reads the calendar day off the front of the string rather than parsing it as
 * an instant: the server sends these in the temple's own offset precisely so
 * the printed day is the temple's day, and `new Date(...)` would re-interpret a
 * midnight IST window in the viewer's zone and print the day before.
 */
export function formatValidityDate(iso: string | null): string {
  if (!iso) return '—'
  const [datePart] = iso.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  if (!y || !m || !d) return '—'
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

/** The USES column: `3 / 500`, or `3 / ∞` when there is no ceiling. */
export function formatUses(uses: number, usageLimit: number | null): string {
  return `${uses} / ${usageLimit ?? '∞'}`
}

/**
 * An ISO datetime → the `datetime-local` value an input expects.
 *
 * Keeps the temple-local wall clock the server sent, rather than converting to
 * the viewer's zone — the field is editing the temple's window, not the
 * viewer's. Sent back as-is; the server re-localizes it.
 */
export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return ''
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return match ? `${match[1]}T${match[2]}` : ''
}
