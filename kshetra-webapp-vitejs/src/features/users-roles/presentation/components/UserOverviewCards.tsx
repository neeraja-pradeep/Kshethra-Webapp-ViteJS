import { Avatar } from '@/shared/ui'
import type { RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { DetailFieldRow } from '@/features/users-roles/presentation/components/DetailFieldRow'
import { BaseRoleBadge, RoleBadge } from '@/features/users-roles/presentation/components/RoleBadge'
import { StatusBadge } from '@/features/users-roles/presentation/components/StatusBadge'

export interface UserOverviewCardsProps {
  user: RbacUserDetail
  createdAtDisplay: string
}

/**
 * Identity card (avatar, contact) + roles card, side by side.
 *
 * The audit trail the design drew — created by / last modified by / last
 * modified on — is gone: the registry returns only `created_at`. Showing a
 * blank or invented actor would be worse than not showing the field.
 */
export function UserOverviewCards({ user, createdAtDisplay }: UserOverviewCardsProps) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 grow basis-[340px] flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <Avatar name={user.username} size="xl" />
          <div className="min-w-0">
            <div className="text-lg font-semibold text-ink-strong">{user.username}</div>
            <div className="mt-1.25 flex flex-wrap items-center gap-1.5">
              <BaseRoleBadge baseRole={user.baseRole} />
              <StatusBadge status={user.isActive ? 'Active' : 'Inactive'} />
            </div>
          </div>
        </div>
        <div className="h-px bg-stroke-subtle" />
        <DetailFieldRow label="Email" value={user.email || '—'} />
        <DetailFieldRow label="Phone" value={user.phone || '—'} />
        <DetailFieldRow label="Created on" value={createdAtDisplay} weight="medium" />
      </div>

      <div className="flex min-w-0 grow basis-[300px] flex-col gap-3.25 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Assigned roles</div>
        {user.isSuperuser && (
          <div className="text-sm leading-snug text-ink-muted">
            Superuser — holds every permission regardless of the roles below.
          </div>
        )}
        {user.assignedRoles.length === 0 ? (
          <div className="text-sm leading-snug text-ink-muted">
            No custom roles. This account has only what its base role grants.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {user.assignedRoles.map((role) => (
              <RoleBadge key={role.id} name={role.name} label={role.label} />
            ))}
          </div>
        )}
        <div className="h-px bg-stroke-subtle" />
        <DetailFieldRow label="Effective permissions" value={String(user.effectivePermissions.length)} weight="medium" />
      </div>
    </div>
  )
}
