import { Input } from '@/shared/ui'

import type { Devotee } from '@/features/devotees/domain/entities/devotee'
import { getInitials } from '@/features/devotees/presentation/lib/initials'
import { formatDisplayDate } from '@/features/devotees/presentation/lib/formatDate'

export interface DevoteeAccountCardProps {
  devotee: Devotee
  editing: boolean
  editPhone: string
  editEmail: string
  onEditPhoneChange: (value: string) => void
  onEditEmailChange: (value: string) => void
}

/** Account identity card: avatar + name + member-since, then phone/email in view or edit mode. */
export function DevoteeAccountCard({ devotee, editing, editPhone, editEmail, onEditPhoneChange, onEditEmailChange }: DevoteeAccountCardProps) {
  return (
    <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-lg font-bold text-primary-subtle-text">
          {getInitials(devotee.name)}
        </span>
        <div className="min-w-0">
          <div className="text-lg font-semibold text-ink-strong">{devotee.name}</div>
          <div className="text-2xs text-ink-subtle">Member since {formatDisplayDate(devotee.joined)}</div>
        </div>
      </div>
      <div className="h-px bg-stroke-subtle" />
      {!editing && (
        <>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Phone</span>
            <span className="text-base font-semibold text-ink-strong">{devotee.phone}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Email</span>
            <span className="break-all text-right text-base font-semibold text-ink-strong">{devotee.email}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Last activity</span>
            <span className="text-base font-semibold text-ink-strong">{formatDisplayDate(devotee.lastActivity)}</span>
          </div>
        </>
      )}
      {editing && (
        <div className="flex flex-col gap-2.5">
          <Input label="Phone" value={editPhone} onChange={(e) => onEditPhoneChange(e.target.value)} />
          <Input label="Email" value={editEmail} onChange={(e) => onEditEmailChange(e.target.value)} />
        </div>
      )}
    </div>
  )
}
