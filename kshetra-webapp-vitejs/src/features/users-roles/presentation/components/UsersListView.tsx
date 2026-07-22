import type { ReactNode } from 'react'

import { Button, Icon, Spinner, type SelectOption } from '@/shared/ui'
import type { KpiItem } from '@/features/users-roles/presentation/utils/kpi'
import { KpiBand } from '@/features/users-roles/presentation/components/KpiBand'
import { PaginationBar } from '@/features/users-roles/presentation/components/PaginationBar'
import { UsersFilterBar } from '@/features/users-roles/presentation/components/UsersFilterBar'
import { UsersTable, type SortDir, type SortKey, type UserRow } from '@/features/users-roles/presentation/components/UsersTable'

export interface UsersListViewProps {
  onAdd: () => void

  search: string
  onSearchChange: (value: string) => void
  roleOptions: readonly SelectOption[]
  filterRole: string
  onFilterRoleChange: (value: string) => void
  statusOptions: readonly SelectOption[]
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  resultLabel: string

  kpis: readonly KpiItem[]

  loading: boolean
  rows: readonly UserRow[]
  sortKey: SortKey | ''
  sortDir: SortDir
  onSort: (key: SortKey) => void
  onRowClick: (row: UserRow) => void
  empty: ReactNode

  pageInfo: string
  pageSizeOptions: readonly SelectOption[]
  pageSize: number
  onPageSizeChange: (size: number) => void
  pageLabel: string
  prevDisabled: boolean
  nextDisabled: boolean
  onPrev: () => void
  onNext: () => void
}

/** The Users & Roles list screen: header, filters, KPI band, table card, pagination. */
export function UsersListView(props: UsersListViewProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Users &amp; Roles</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Employee and login registry. Role determines module access.</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2.5">
          <Button theme="primary" onClick={props.onAdd} iconLeft={<Icon name="plus" size={16} />}>
            Add user
          </Button>
        </div>
      </div>

      <UsersFilterBar
        search={props.search}
        onSearchChange={props.onSearchChange}
        roleOptions={props.roleOptions}
        filterRole={props.filterRole}
        onFilterRoleChange={props.onFilterRoleChange}
        statusOptions={props.statusOptions}
        filterStatus={props.filterStatus}
        onFilterStatusChange={props.onFilterStatusChange}
        resultLabel={props.resultLabel}
      />

      <KpiBand items={props.kpis} />

      {props.loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Spinner size={40} />
        </div>
      ) : (
        <>
          <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
            <div className="min-h-0 flex-1 overflow-auto">
              <UsersTable rows={props.rows} sortKey={props.sortKey} sortDir={props.sortDir} onSort={props.onSort} onRowClick={props.onRowClick} empty={props.empty} />
            </div>
          </div>
          <PaginationBar
            pageInfo={props.pageInfo}
            pageSizeOptions={props.pageSizeOptions}
            pageSize={props.pageSize}
            onPageSizeChange={props.onPageSizeChange}
            pageLabel={props.pageLabel}
            prevDisabled={props.prevDisabled}
            nextDisabled={props.nextDisabled}
            onPrev={props.onPrev}
            onNext={props.onNext}
          />
        </>
      )}
    </div>
  )
}
