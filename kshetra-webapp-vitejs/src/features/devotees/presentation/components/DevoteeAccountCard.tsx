import type { DevoteeDetail } from '@/features/devotees/domain/entities/devotee'
import { formatDisplayDate, formatDisplayDateTime } from '@/features/devotees/presentation/lib/formatDate'
import { getInitials } from '@/features/devotees/presentation/lib/initials'

export interface DevoteeAccountCardProps {
  devotee: DevoteeDetail
}

/**
 * Account identity: avatar, name, and the contact details as the devotee
 * entered them in the app. Read-only — nothing in the back office writes them.
 *
 * The phone is printed exactly as stored rather than regrouped: the app's own
 * sign-up form sends ten bare digits and a Firebase sign-in sends E.164, and
 * formatting either here would show the operator something other than what
 * searching actually matches.
 */
export function DevoteeAccountCard({ devotee }: DevoteeAccountCardProps) {
  const rows: { label: string; value: string }[] = [
    { label: 'Phone', value: devotee.phone ?? '—' },
    { label: 'Email', value: devotee.email ?? '—' },
    { label: 'Username', value: devotee.username },
    { label: 'Last activity', value: formatDisplayDateTime(devotee.lastActivity) },
    { label: 'Last sign-in', value: formatDisplayDateTime(devotee.lastLogin) },
  ]

  return (
    <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-lg font-bold text-primary-subtle-text">
          {getInitials(devotee.name)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-ink-strong">{devotee.name}</div>
          <div className="text-2xs text-ink-subtle">Member since {formatDisplayDate(devotee.joinedAt)}</div>
        </div>
      </div>
      <div className="h-px bg-stroke-subtle" />
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4">
          <span className="shrink-0 text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{row.label}</span>
          <span className="break-all text-right text-base font-semibold text-ink-strong">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
