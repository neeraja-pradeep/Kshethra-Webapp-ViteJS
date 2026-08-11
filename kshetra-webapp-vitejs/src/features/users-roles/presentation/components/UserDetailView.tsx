import { Alert, Button, Icon } from '@/shared/ui'
import type { RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { EffectivePermissionsPanel } from '@/features/users-roles/presentation/components/EffectivePermissionsPanel'
import { ScreenTopBar } from '@/features/users-roles/presentation/components/ScreenTopBar'
import { StatusBadge } from '@/features/users-roles/presentation/components/StatusBadge'
import { UserOverviewCards } from '@/features/users-roles/presentation/components/UserOverviewCards'
import { formatDisplayDate } from '@/features/users-roles/presentation/utils/date'

export interface UserDetailViewProps {
  user: RbacUserDetail
  /** Whether the signed-in operator may change this user's roles. */
  canEditRoles: boolean
  onClose: () => void
  onEditRoles: () => void
}

/**
 * Read-first user detail: identity, roles, and the resolved permission set.
 *
 * The design's role-specific activity panels (counter takings, store
 * fulfilment, poojari schedule) and its account-lifecycle card are absent —
 * the registry exposes no metrics, and there is no endpoint that deactivates
 * or deletes an account. Both are tracked in the unbuilt-UI backlog.
 */
export function UserDetailView({ user, canEditRoles, onClose, onEditRoles }: UserDetailViewProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-sunken">
      <ScreenTopBar
        onBack={onClose}
        crumb="Users & Roles"
        title={user.username}
        right={
          <>
            <StatusBadge status={user.isActive ? 'Active' : 'Inactive'} />
            {canEditRoles && (
              <Button theme="default" variant="outline" size="sm" onClick={onEditRoles} iconLeft={<Icon name="pencil-simple" size={14} />}>
                Edit roles
              </Button>
            )}
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-4 px-6 pb-14 pt-6">
          <UserOverviewCards user={user} createdAtDisplay={formatDisplayDate(user.createdAt)} />

          <EffectivePermissionsPanel permissions={user.effectivePermissions} />

          {!user.isActive && (
            <Alert type="warning" icon={<Icon name="warning" size={16} />}>
              This account is deactivated and cannot sign in. Reactivating it is not available through this API.
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
