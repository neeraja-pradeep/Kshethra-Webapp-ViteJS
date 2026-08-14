import type { ReactNode } from 'react'

import { Button, Icon, Spinner, Switch, type SelectOption } from '@/shared/ui'
import type { RbacRole } from '@/features/rbac/domain/entities/rbac-role'
import { RolesKpiBand, type RoleKpi } from '@/features/rbac/presentation/components/RolesKpiBand'
import { RolesPaginationBar } from '@/features/rbac/presentation/components/RolesPaginationBar'
import { RolesTable } from '@/features/rbac/presentation/components/RolesTable'

export interface RolesTabViewProps {
  customOnly: boolean
  onCustomOnlyChange: (value: boolean) => void
  resultLabel: string
  kpis: readonly RoleKpi[]

  /** Authoring a role is `manage_roles`; merely listing them is `assign_roles`. */
  canCreate: boolean
  onCreate: () => void

  loading: boolean
  rows: readonly RbacRole[]
  onRowClick: (role: RbacRole) => void
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
 * The Roles tab: the role catalogue, with the builder reached by clicking a row.
 *
 * There is no search box. `GET rbac/roles/` takes `custom_only`, `page` and
 * `page_size` and nothing else, and filtering the loaded page in the browser
 * would read as filtering the catalogue — the same trap the users list avoided
 * with its status filter.
 */
export function RolesTabView(props: RolesTabViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5 px-7 pb-3 pt-3.5">
        <Switch
          checked={props.customOnly}
          onChange={(e) => props.onCustomOnlyChange(e.target.checked)}
          label="Custom roles only"
          description="Hide the roles defined in code"
          size="sm"
        />
        <div className="flex-1" />
        <span className="text-sm text-ink-subtle">{props.resultLabel}</span>
        {props.canCreate && (
          <Button theme="primary" size="sm" iconLeft={<Icon name="plus" size={15} />} onClick={props.onCreate}>
            Create role
          </Button>
        )}
      </div>

      <RolesKpiBand items={props.kpis} />

      {props.loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Spinner size={40} />
        </div>
      ) : (
        <>
          <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
            <div className="min-h-0 flex-1 overflow-auto">
              <RolesTable rows={props.rows} onRowClick={props.onRowClick} empty={props.empty} />
            </div>
          </div>
          <RolesPaginationBar
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
