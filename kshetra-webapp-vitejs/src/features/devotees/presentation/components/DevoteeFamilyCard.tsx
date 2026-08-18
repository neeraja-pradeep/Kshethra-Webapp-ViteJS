import { Icon } from '@/shared/ui'

import type { DevoteeDetail } from '@/features/devotees/domain/entities/devotee'
import { formatDisplayDate } from '@/features/devotees/presentation/lib/formatDate'

export interface DevoteeFamilyCardProps {
  devotee: DevoteeDetail
}

/**
 * The people this account books for — the saved profiles behind the FAMILY
 * column, the account holder's own among them.
 *
 * Read-only. These are the devotee's own records, editable from the app's
 * family screen and nowhere else: the back office endpoint that serves them is
 * scoped to the signed-in user, so an admin has no way to write one.
 */
export function DevoteeFamilyCard({ devotee }: DevoteeFamilyCardProps) {
  const family = devotee.family
  const countLabel = `${family.length} ${family.length === 1 ? 'member' : 'members'}`

  return (
    <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Family</span>
        <div className="flex-1" />
        <span className="text-2xs text-ink-subtle">{countLabel}</span>
      </div>

      <div className="flex flex-col gap-2">
        {family.map((member) => (
          <div key={member.id} className="flex items-center gap-2.5 rounded-md bg-sunken px-2.75 py-2.25">
            <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-card text-ink-muted shadow-xs">
              <Icon name="user" size={14} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-ink-strong">{member.name}</span>
                {/* Why the smallest family count on the table is 1, not 0. */}
                {member.isSelf && (
                  <span className="shrink-0 rounded-full bg-card px-1.5 py-px text-2xs font-semibold uppercase tracking-overline text-ink-subtle shadow-xs">
                    Self
                  </span>
                )}
              </span>
              {member.dob && <span className="text-2xs text-ink-subtle">{formatDisplayDate(member.dob)}</span>}
            </span>
            {/* Active attributes only — a nakshatram they have since changed is not listed. */}
            <span className="shrink-0 text-right text-2xs text-ink-subtle">{member.nakshatrams.join(', ') || '—'}</span>
          </div>
        ))}
        {family.length === 0 && (
          <div className="px-0.5 py-2 text-sm text-ink-subtle">
            This account has never opened the family screen.
          </div>
        )}
      </div>
    </div>
  )
}
