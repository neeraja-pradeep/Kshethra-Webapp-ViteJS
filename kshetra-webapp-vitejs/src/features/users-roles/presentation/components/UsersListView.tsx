import type { ReactNode } from 'react'

import { Button, Icon, Spinner, type SelectOption } from '@/shared/ui'
import type { KpiItem } from '@/features/users-roles/presentation/utils/kpi'
import { KpiBand } from '@/features/users-roles/presentation/components/KpiBand'
import { PaginationBar } from '@/features/users-roles/presentation/components/PaginationBar'
import { UsersFilterBar } from '@/features/users-roles/presentation/components/UsersFilterBar'
import { UsersTable, type UserRow } from '@/features/users-roles/presentation/components/UsersTable'

export interface UsersListViewProps {
  search: string
  onSearchChange: (value: string) => void
  roleOptions: readonly SelectOption[]
  filterRole: string
  onFilterRoleChange: (value: string) => void
  baseRoleOptions: readonly SelectOption[]
  filterBaseRole: string
  onFilterBaseRoleChange: (value: string) => void
  resultLabel: string

  /** Creating an account is `manage_users` — a step above assigning roles. */
  canCreate: boolean
  onCreate: () => void

  kpis: readonly KpiItem[]

  loading: boolean
  rows: readonly UserRow[]
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

/**
 * The Users tab: filters, KPI band, table, pagination.
 *
 * The screen title and the Users/Roles tab strip live one level up, in
 * `UsersRolesScreen`, so both tabs sit under one header rather than each
 * drawing its own.
 */
export function UsersListView(props: UsersListViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-2.5 px-7 pb-1 pt-3.5">
        <div className="flex-1" />
        {props.canCreate && (
          <Button theme="primary" size="sm" iconLeft={<Icon name="plus" size={15} />} onClick={props.onCreate}>
            Add user
          </Button>
        )}
      </div>

      <UsersFilterBar
        search={props.search}
        onSearchChange={props.onSearchChange}
        roleOptions={props.roleOptions}
        filterRole={props.filterRole}
        onFilterRoleChange={props.onFilterRoleChange}
        baseRoleOptions={props.baseRoleOptions}
        filterBaseRole={props.filterBaseRole}
        onFilterBaseRoleChange={props.onFilterBaseRoleChange}
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
              <UsersTable rows={props.rows} onRowClick={props.onRowClick} empty={props.empty} />
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
