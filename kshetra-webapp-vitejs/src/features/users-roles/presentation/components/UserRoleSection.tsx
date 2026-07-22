import { Icon, Select, type SelectOption } from '@/shared/ui'
import type { Role } from '@/features/users-roles/domain/entities/role'

export interface UserRoleSectionProps {
  roleOptions: readonly SelectOption[]
  roleId: string
  error?: string
  chosenRole: Role | null
  onRoleChange: (roleId: string) => void
}

/** Add/edit form — role card: the assigned-role select plus a read-only "what this grants" helper. */
export function UserRoleSection({ roleOptions, roleId, error, chosenRole, onRoleChange }: UserRoleSectionProps) {
  const isAll = chosenRole?.kind === 'admin'
  const isNone = chosenRole?.kind === 'poojari'
  const hasModules = !!chosenRole && !isAll && !isNone

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5.5 shadow-sm">
      <div>
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Role</div>
        <div className="mt-1 text-2xs text-ink-subtle">Role determines module access. Access is predefined per role.</div>
      </div>

      <Select label="Assigned role" required options={roleOptions as SelectOption[]} value={roleId} onChange={(e) => onRoleChange(e.target.value)} error={error} placeholder="Select role" />

      {chosenRole && (
        <div className="flex flex-col gap-2.25 rounded-lg bg-active px-3.75 py-3.25">
          <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Access this role grants</div>
          <div className="text-sm leading-snug text-ink">{chosenRole.desc}</div>

          {isAll && (
            <div className="inline-flex items-center gap-1.75 text-sm font-medium text-primary-subtle-text">
              <Icon name="shield-check" size={15} />
              All modules + user management
            </div>
          )}
          {isNone && (
            <div className="inline-flex items-center gap-1.75 text-sm font-medium text-ink-muted">
              <Icon name="device-mobile" size={15} />
              Priest app only — no admin web access
            </div>
          )}
          {hasModules && (
            <div className="flex flex-wrap gap-1.5">
              {chosenRole.modules.map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.75 py-1 text-xs font-medium text-ink shadow-xs">
                  <Icon name="check" size={12} color="var(--color-success)" />
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
