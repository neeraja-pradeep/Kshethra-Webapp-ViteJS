import { Alert, Button, Checkbox, Icon, Spinner } from '@/shared/ui'
import type { RbacRole } from '@/features/rbac/domain/entities/rbac-role'
import type { RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { RoleBadge } from '@/features/users-roles/presentation/components/RoleBadge'
import { ScreenTopBar } from '@/features/users-roles/presentation/components/ScreenTopBar'
import { baseRoleLabel } from '@/features/users-roles/presentation/utils/roles'

export interface UserRolesEditorProps {
  user: RbacUserDetail
  /** Assignable roles only — built-ins and inactive roles are rejected by the server. */
  roles: readonly RbacRole[]
  rolesLoading: boolean
  selectedIds: readonly number[]
  saving: boolean
  error: string | null
  onToggleRole: (roleId: number) => void
  onCancel: () => void
  onSave: () => void
}

/**
 * Assign roles to one user.
 *
 * A multi-select, not the design's single-select: the server models roles as
 * additive on top of a fixed base role, so "the user's role" does not exist.
 * Saving replaces the whole custom-role set — clearing every box is a valid
 * edit that strips the account back to its base role.
 */
export function UserRolesEditor({
  user,
  roles,
  rolesLoading,
  selectedIds,
  saving,
  error,
  onToggleRole,
  onCancel,
  onSave,
}: UserRolesEditorProps) {
  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <ScreenTopBar
        onBack={onCancel}
        crumb="Users & Roles"
        title={`Roles · ${user.username}`}
        right={
          <>
            <Button theme="default" variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button theme="primary" onClick={onSave} disabled={saving || rolesLoading}>
              {saving ? 'Saving…' : 'Save roles'}
            </Button>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-6 pb-14 pt-6">
          {error && <Alert type="danger" icon={<Icon name="warning" size={16} />}>{error}</Alert>}

          <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5.5 shadow-sm">
            <div>
              <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Base role</div>
              <div className="mt-1 text-2xs text-ink-subtle">
                Fixed on the account and not editable here — it decides which sign-in endpoint accepts this user.
              </div>
            </div>
            <div>
              <RoleBadge name={user.baseRole} label={baseRoleLabel(user.baseRole, user.baseRoleLabel)} variant="base" />
            </div>
          </div>

          <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5.5 shadow-sm">
            <div>
              <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Assigned roles</div>
              <div className="mt-1 text-2xs text-ink-subtle">
                Permissions are the union of the base role and everything ticked here. Assigning never takes anything away.
              </div>
            </div>

            {rolesLoading ? (
              <div className="flex justify-center py-6">
                <Spinner size={24} />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-sm text-ink-muted">
                No assignable roles exist yet. Built-in roles can&apos;t be assigned as extras, so a custom role has to be
                created first.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {roles.map((role) => (
                  <label key={role.id} className="flex cursor-pointer items-start gap-2.75 rounded-lg px-1 py-1.5 hover:bg-active">
                    <Checkbox checked={selectedIds.includes(role.id)} onChange={() => onToggleRole(role.id)} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink-strong">{role.label}</div>
                      {role.description && <div className="mt-0.5 text-xs leading-snug text-ink-subtle">{role.description}</div>}
                      <div className="mt-0.5 text-2xs text-ink-subtle">{role.permissionCount} permissions</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Alert type="info" icon={<Icon name="info" size={16} />}>
            Changes take effect on this user&apos;s next request — they do not need to sign in again.
          </Alert>
        </div>
      </div>
    </div>
  )
}
