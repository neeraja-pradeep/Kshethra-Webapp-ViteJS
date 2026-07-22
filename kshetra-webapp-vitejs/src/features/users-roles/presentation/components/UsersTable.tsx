import type { ReactNode } from 'react'

import { Avatar, Table, type TableColumn } from '@/shared/ui'
import type { UserStatus } from '@/features/users-roles/domain/entities/user'
import { RoleBadge } from '@/features/users-roles/presentation/components/RoleBadge'
import { SortableColumnHeader } from '@/features/users-roles/presentation/components/SortableColumnHeader'
import { StatusBadge } from '@/features/users-roles/presentation/components/StatusBadge'

export interface UserRow {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly avatar: string | null
  readonly roleId: string
  readonly roleLabel: string
  readonly status: UserStatus
}

export type SortKey = 'name' | 'roleLabel' | 'status'
export type SortDir = 'asc' | 'desc'

export interface UsersTableProps {
  rows: readonly UserRow[]
  sortKey: SortKey | ''
  sortDir: SortDir
  onSort: (key: SortKey) => void
  onRowClick: (row: UserRow) => void
  empty: ReactNode
}

/** The user registry table: two-line user cell (avatar + name/email), role, status. */
export function UsersTable({ rows, sortKey, sortDir, onSort, onRowClick, empty }: UsersTableProps) {
  const columns: TableColumn<UserRow>[] = [
    {
      key: 'name',
      header: <SortableColumnHeader label="User" sortKey="name" activeSortKey={sortKey} sortDir={sortDir} onSort={(k) => onSort(k as SortKey)} />,
      render: (_value, row) => (
        <div className="flex items-center gap-2.75 py-0.5">
          <Avatar name={row.name} src={row.avatar ?? undefined} size="sm" />
          <div className="flex min-w-0 flex-col gap-0.25">
            <span className="whitespace-nowrap font-medium text-ink-strong">{row.name}</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-ink-subtle">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'roleLabel',
      header: <SortableColumnHeader label="Role" sortKey="roleLabel" activeSortKey={sortKey} sortDir={sortDir} onSort={(k) => onSort(k as SortKey)} />,
      render: (_value, row) => <RoleBadge roleId={row.roleId} />,
    },
    {
      key: 'status',
      header: <SortableColumnHeader label="Status" sortKey="status" activeSortKey={sortKey} sortDir={sortDir} onSort={(k) => onSort(k as SortKey)} />,
      render: (_value, row) => <StatusBadge status={row.status} />,
    },
  ]

  return <Table columns={columns} rows={rows as UserRow[]} onRowClick={onRowClick} empty={empty} />
}
