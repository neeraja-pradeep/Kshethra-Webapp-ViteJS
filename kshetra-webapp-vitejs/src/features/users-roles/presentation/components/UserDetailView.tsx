import type { ReactNode } from 'react'

import { Alert, Button, Icon } from '@/shared/ui'
import type { RbacUserDetail } from '@/features/rbac/domain/entities/rbac-user'
import { EffectivePermissionsPanel } from '@/features/users-roles/presentation/components/EffectivePermissionsPanel'
import { ModuleAccessPanel } from '@/features/users-roles/presentation/components/ModuleAccessPanel'
import { ScreenTopBar } from '@/features/users-roles/presentation/components/ScreenTopBar'
import { StatusBadge } from '@/features/users-roles/presentation/components/StatusBadge'
import { UserOverviewCards } from '@/features/users-roles/presentation/components/UserOverviewCards'
import { formatDisplayDate } from '@/features/users-roles/presentation/utils/date'

export interface UserDetailViewProps {
  user: RbacUserDetail
  /** Whether the signed-in operator may change this user's roles. */
  canEditRoles: boolean
  /** `manage_users` + `change_customuser` — editing identity and base role. */
  canEditUser: boolean
  onClose: () => void
  onEditRoles: () => void
  onEditUser: () => void
  /**
   * The shrine card, for a poojari account only. The screen owns the query and
   * the mutation, and passes `null` for every other role.
   */
  shrines?: ReactNode
  /** The lifecycle card, rendered by the screen so it owns the mutations. */
  lifecycle?: ReactNode
}

/**
 * Read-first user detail: identity, roles, and the resolved permission set.
 *
 * The design's role-specific activity panels (counter takings, store
 * fulfilment, poojari schedule) are still absent — the registry exposes no
 * metrics, and every number in them was prototype fiction.
 */
export function UserDetailView({ user, canEditRoles, canEditUser, onClose, onEditRoles, onEditUser, shrines, lifecycle }: UserDetailViewProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-sunken">
      <ScreenTopBar
        onBack={onClose}
        crumb="Users & Roles"
        title={user.username}
        right={
          <>
            <StatusBadge status={user.isActive ? 'Active' : 'Inactive'} />
            {canEditUser && (
              <Button theme="default" variant="outline" size="sm" onClick={onEditUser} iconLeft={<Icon name="user-gear" size={14} />}>
                Edit account
              </Button>
            )}
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

          {/* The server groups the codenames into modules; only a backend that
              predates that field leaves us with the flat list to show. */}
          {user.modules.length > 0 ? (
            <ModuleAccessPanel modules={user.modules} permissions={user.effectivePermissions} />
          ) : (
            <EffectivePermissionsPanel permissions={user.effectivePermissions} />
          )}

          {!user.isActive && (
            <Alert type="warning" icon={<Icon name="warning" size={16} />}>
              This account is deactivated and cannot sign in.
            </Alert>
          )}

          {shrines}

          {lifecycle}
        </div>
      </div>
    </div>
  )
}
