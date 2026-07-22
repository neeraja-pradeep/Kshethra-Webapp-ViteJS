import { Avatar } from '@/shared/ui'
import { RoleBadge } from '@/features/users-roles/presentation/components/RoleBadge'
import { StatusBadge } from '@/features/users-roles/presentation/components/StatusBadge'
import type { User } from '@/features/users-roles/domain/entities/user'

export interface UserOverviewCardsProps {
  user: User
  roleDesc: string
  webAccessLabel: string
  createdAtDisplay: string
  modifiedAtDisplay: string
}

function Field({ label, value, weight = 'semibold' }: { label: string; value: string; weight?: 'medium' | 'semibold' }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{label}</span>
      <span className={weight === 'medium' ? 'text-right text-base font-medium text-ink-strong' : 'text-right text-base font-semibold text-ink-strong'}>{value}</span>
    </div>
  )
}

/** Identity card (avatar, contact) + role &amp; record card (desc, audit trail) side by side. */
export function UserOverviewCards({ user, roleDesc, webAccessLabel, createdAtDisplay, modifiedAtDisplay }: UserOverviewCardsProps) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 grow basis-[340px] flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <Avatar name={user.name} src={user.avatar ?? undefined} size="xl" />
          <div className="min-w-0">
            <div className="text-lg font-semibold text-ink-strong">{user.name}</div>
            <div className="mt-1.25 flex flex-wrap items-center gap-1.5">
              <RoleBadge roleId={user.roleId} />
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>
        <div className="h-px bg-stroke-subtle" />
        <Field label="Email" value={user.email} />
        <Field label="Phone" value={user.phone} />
        <Field label="Web access" value={webAccessLabel} />
      </div>

      <div className="flex min-w-0 grow basis-[300px] flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Role &amp; record</div>
        <div className="text-sm leading-snug text-ink-muted">{roleDesc}</div>
        <div className="h-px bg-stroke-subtle" />
        <Field label="Created by" value={user.createdBy} />
        <Field label="Created on" value={createdAtDisplay} weight="medium" />
        <Field label="Last modified by" value={user.modifiedBy} />
        <Field label="Last modified on" value={modifiedAtDisplay} weight="medium" />
      </div>
    </div>
  )
}
