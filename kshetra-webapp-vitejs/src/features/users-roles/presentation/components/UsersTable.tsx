import type { ReactNode } from 'react'

import { Avatar, Table, type TableColumn } from '@/shared/ui'
import { BaseRoleBadge, RoleBadge } from '@/features/users-roles/presentation/components/RoleBadge'
import { StatusBadge } from '@/features/users-roles/presentation/components/StatusBadge'

/** One assigned role, as far as the table needs to know. */
export interface UserRowRole {
  readonly name: string
  readonly label: string
}

export interface UserRow {
  readonly id: number
  readonly username: string
  readonly email: string
  readonly phone: string
  readonly baseRole: string
  /** Custom roles granted on top of the base role. Often empty. */
  readonly roles: readonly UserRowRole[]
  readonly isActive: boolean
}

export interface UsersTableProps {
  rows: readonly UserRow[]
  onRowClick: (row: UserRow) => void
  empty: ReactNode
}

/**
 * The user registry table.
 *
 * Base role and assigned roles are separate columns because they are separate
 * things: the base role decides which sign-in endpoint accepts the account,
 * while the assigned roles are what actually grant console access. Collapsing
 * them into one "Role" column is what made the mock version misleading.
 */
export function UsersTable({ rows, onRowClick, empty }: UsersTableProps) {
  const columns: TableColumn<UserRow>[] = [
    {
      key: 'username',
      header: 'User',
      render: (_value, row) => (
        <div className="flex items-center gap-2.75 py-0.5">
          <Avatar name={row.username} size="sm" />
          <div className="flex min-w-0 flex-col gap-0.25">
            <span className="whitespace-nowrap font-medium text-ink-strong">{row.username}</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-ink-subtle">
              {row.email || row.phone || '—'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'baseRole',
      header: 'Base role',
      render: (_value, row) => <BaseRoleBadge baseRole={row.baseRole} />,
    },
    {
      key: 'roles',
      header: 'Assigned roles',
      render: (_value, row) =>
        row.roles.length === 0 ? (
          <span className="text-sm text-ink-subtle">—</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {row.roles.map((role) => (
              <RoleBadge key={role.name} name={role.name} label={role.label} />
            ))}
          </div>
        ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (_value, row) => <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />,
    },
  ]

  return <Table columns={columns} rows={rows as UserRow[]} onRowClick={onRowClick} empty={empty} />
}
