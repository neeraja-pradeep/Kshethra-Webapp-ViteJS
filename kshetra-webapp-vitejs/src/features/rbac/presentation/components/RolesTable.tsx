import type { ReactNode } from 'react'

import { Badge, Table, type TableColumn } from '@/shared/ui'
import type { RbacRole } from '@/features/rbac/domain/entities/rbac-role'
import { roleBadgeColor } from '@/features/rbac/presentation/lib/roleDisplay'

export interface RolesTableProps {
  rows: readonly RbacRole[]
  onRowClick: (role: RbacRole) => void
  empty: ReactNode
}

/**
 * The role catalogue.
 *
 * `name` is shown beside the label because it is the permanent identifier — it
 * is fixed at creation, ignored by `PATCH`, and it is what colours the badge, so
 * a renamed role keeps its colour. An operator who only ever sees the label has
 * no way to tell which of two similarly-named roles they are editing.
 */
export function RolesTable({ rows, onRowClick, empty }: RolesTableProps) {
  const columns: TableColumn<RbacRole>[] = [
    {
      key: 'label',
      header: 'Role',
      render: (_value, row) => (
        <div className="flex items-center gap-2.5 py-0.5">
          <Badge color={row.isSystem ? 'gray' : roleBadgeColor(row.name)} size="sm">
            {row.label}
          </Badge>
          <div className="flex min-w-0 flex-col gap-0.25">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-ink-subtle">{row.name}</span>
            {row.description && (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-ink-subtle">{row.description}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'isSystem',
      header: 'Kind',
      width: 130,
      render: (_value, row) =>
        row.isSystem ? (
          <Badge color="blue" size="sm">Built-in</Badge>
        ) : (
          <span className="text-sm text-ink-subtle">Custom</span>
        ),
    },
    {
      key: 'userCount',
      header: 'Users',
      width: 90,
      align: 'right',
      render: (_value, row) => <span className="text-sm text-ink">{row.userCount}</span>,
    },
    {
      key: 'permissionCount',
      header: 'Permissions',
      width: 120,
      align: 'right',
      render: (_value, row) => <span className="text-sm text-ink">{row.permissionCount}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      width: 110,
      render: (_value, row) => (
        // An inactive role still exists and still holds its permissions; it
        // simply cannot be assigned. "Inactive" rather than "Disabled" because
        // that is the word the server's `400` uses when an assignment is refused.
        <Badge color={row.isActive ? 'green' : 'gray'} size="sm">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return <Table columns={columns} rows={rows as RbacRole[]} onRowClick={onRowClick} empty={empty} />
}
