import { Button, Icon } from '@/shared/ui'
import type { Role } from '@/features/users-roles/domain/entities/role'
import type { User } from '@/features/users-roles/domain/entities/user'
import { AccountLifecycleCard } from '@/features/users-roles/presentation/components/AccountLifecycleCard'
import { CounterActivityPanel } from '@/features/users-roles/presentation/components/CounterActivityPanel'
import { ModuleAccessPanel } from '@/features/users-roles/presentation/components/ModuleAccessPanel'
import { PoojariActivityPanel } from '@/features/users-roles/presentation/components/PoojariActivityPanel'
import { ScreenTopBar } from '@/features/users-roles/presentation/components/ScreenTopBar'
import { StatusBadge } from '@/features/users-roles/presentation/components/StatusBadge'
import { StoreActivityPanel } from '@/features/users-roles/presentation/components/StoreActivityPanel'
import { UserOverviewCards } from '@/features/users-roles/presentation/components/UserOverviewCards'
import { formatDisplayDate } from '@/features/users-roles/presentation/utils/date'

export interface UserDetailViewProps {
  user: User
  role: Role
  godNames: readonly string[]
  onClose: () => void
  onEdit: () => void
  onDeactivate: () => void
  onReactivate: () => void
  onDelete: () => void
}

/** Read-first user detail screen: identity/record, role-specific activity, lifecycle actions. */
export function UserDetailView({ user, role, godNames, onClose, onEdit, onDeactivate, onReactivate, onDelete }: UserDetailViewProps) {
  const isActive = user.status === 'Active'
  const deleteDisabled = user.activity > 0
  const lifecycleNote = deleteDisabled
    ? 'Can’t delete — this user has recorded activity. Deactivate to revoke access while keeping history.'
    : 'No recorded activity, so this user can be permanently deleted.'

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-sunken">
      <ScreenTopBar
        onBack={onClose}
        crumb="Users & Roles"
        title={user.name}
        right={
          <>
            <StatusBadge status={user.status} />
            <Button theme="default" variant="outline" size="sm" onClick={onEdit} iconLeft={<Icon name="pencil-simple" size={14} />}>
              Edit
            </Button>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-4 px-6 pb-14 pt-6">
          <UserOverviewCards
            user={user}
            roleDesc={role.desc}
            webAccessLabel={role.web ? 'Web console' : 'Priest app only'}
            createdAtDisplay={formatDisplayDate(user.createdAt)}
            modifiedAtDisplay={formatDisplayDate(user.modifiedAt)}
          />

          {role.kind === 'poojari' && <PoojariActivityPanel godNames={godNames} metrics={user.metrics} />}
          {role.kind === 'counter' && <CounterActivityPanel metrics={user.metrics} />}
          {role.kind === 'store' && <StoreActivityPanel metrics={user.metrics} />}
          {(role.kind === 'manager' || role.kind === 'admin') && <ModuleAccessPanel isAdmin={role.kind === 'admin'} modules={role.modules} />}

          <AccountLifecycleCard
            note={lifecycleNote}
            isActive={isActive}
            deleteDisabled={deleteDisabled}
            onDeactivate={onDeactivate}
            onReactivate={onReactivate}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  )
}
