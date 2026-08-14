import { useEffect, useMemo, useRef, useState } from 'react'

import { toFailure } from '@/core/error/result'
import type { SelectOption } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import { useSetUserRolesMutation } from '@/features/rbac/application/queries/useRbacMutations'
import { useRbacUserQuery, useRbacUsersQuery, useRolesQuery } from '@/features/rbac/application/queries/useRbacQueries'
import { isAssignable } from '@/features/rbac/domain/entities/rbac-role'
import { EmptyFilteredMessage } from '@/features/users-roles/presentation/components/EmptyFilteredMessage'
import { UserDetailView } from '@/features/users-roles/presentation/components/UserDetailView'
import { UserRolesEditor } from '@/features/users-roles/presentation/components/UserRolesEditor'
import { UsersListView } from '@/features/users-roles/presentation/components/UsersListView'
import type { UserRow } from '@/features/users-roles/presentation/components/UsersTable'
import { UserToast } from '@/features/users-roles/presentation/components/UserToast'
import type { KpiItem } from '@/features/users-roles/presentation/utils/kpi'
import { baseRoleLabel } from '@/features/users-roles/presentation/utils/roles'

const PAGE_SIZES = [20, 50, 100]
const DEFAULT_PAGE_SIZE = 20
/** Long enough that typing a name is one request, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 300
const TOAST_MS = 2400

const ALL = 'all'
const BASE_ROLES = ['temple_user', 'temple_poojari', 'temple_admin'] as const

const BASE_ROLE_FILTER_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'All base roles' },
  ...BASE_ROLES.map((role) => ({ value: role, label: baseRoleLabel(role) })),
]
const PAGE_SIZE_OPTIONS: SelectOption[] = PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} / page` }))

type ViewMode = 'list' | 'detail' | 'roles'

/**
 * Users & Roles — the login registry, backed by `rbac/users/`.
 *
 * Search, role and base-role filters and pagination are all server-side; the
 * screen holds no copy of the user list. The design's status filter and column
 * sorting are absent because `rbac/users/` ignores `is_active` and `ordering`,
 * and filtering one page client-side would read as filtering all of them.
 */
export function UsersRolesScreen() {
  const can = useCan()
  const canAssignRoles = can(PERMISSIONS.assignRoles)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterRole, setFilterRole] = useState(ALL)
  const [filterBaseRole, setFilterBaseRole] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [view, setView] = useState<ViewMode>('list')
  const [openId, setOpenId] = useState<number | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<readonly number[]>([])
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  function showToast(message: string) {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_MS)
  }

  const usersQuery = useRbacUsersQuery({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filterRole === ALL ? {} : { role: filterRole }),
    ...(filterBaseRole === ALL ? {} : { baseRole: filterBaseRole }),
    page,
    pageSize,
  })

  /** Custom roles only — the three built-ins can never be assigned as extras. */
  const rolesQuery = useRolesQuery({ customOnly: true, pageSize: 100 })
  const assignableRoles = useMemo(
    () => (rolesQuery.data?.results ?? []).filter(isAssignable),
    [rolesQuery.data],
  )

  const detailQuery = useRbacUserQuery(view === 'list' ? null : openId)
  const setRoles = useSetUserRolesMutation()

  const roleFilterOptions: SelectOption[] = useMemo(
    () => [
      { value: ALL, label: 'All roles' },
      ...(rolesQuery.data?.results ?? []).map((role) => ({ value: role.name, label: role.label })),
    ],
    [rolesQuery.data],
  )

  const total = usersQuery.data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const rows: readonly UserRow[] = useMemo(
    () =>
      (usersQuery.data?.results ?? []).map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        baseRole: user.baseRole,
        roles: user.assignedRoles.map((role) => ({ name: role.name, label: role.label })),
        isActive: user.isActive,
      })),
    [usersQuery.data],
  )

  /**
   * Both tiles are server totals. The design's Active/Inactive breakdown is
   * gone: the registry returns no status counts, and counting the loaded page
   * would report a page total as if it were the whole registry.
   */
  const kpis: readonly KpiItem[] = useMemo(
    () => [
      { key: 'total', value: String(total), label: total === 1 ? 'user' : 'users' },
      { key: 'roles', value: String(rolesQuery.data?.count ?? 0), label: 'custom roles' },
    ],
    [total, rolesQuery.data],
  )

  const filtersActive = debouncedSearch !== '' || filterRole !== ALL || filterBaseRole !== ALL
  const resultLabel = filtersActive ? `${total} matching` : `${total} ${total === 1 ? 'user' : 'users'}`
  const firstOnPage = total === 0 ? 0 : (page - 1) * pageSize + 1
  const pageInfo = total ? `Showing ${firstOnPage}–${Math.min(total, page * pageSize)} of ${total} users` : 'No users'

  function handleClearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setFilterRole(ALL)
    setFilterBaseRole(ALL)
    setPage(1)
  }

  const loadError = usersQuery.isError ? (toFailure(usersQuery.error)?.message ?? 'Could not load users.') : null
  const emptyContent = loadError ?? (filtersActive
    ? <EmptyFilteredMessage message="No users match your filters." onClearFilters={handleClearFilters} />
    : 'No users yet.')

  function handleRowClick(row: UserRow) {
    setOpenId(row.id)
    setView('detail')
  }

  function handleCloseDetail() {
    setView('list')
    setOpenId(null)
  }

  function handleEditRoles() {
    setSelectedRoleIds((detailQuery.data?.assignedRoles ?? []).map((role) => role.id))
    setRoles.reset()
    setView('roles')
  }

  function handleToggleRole(roleId: number) {
    setSelectedRoleIds((ids) => (ids.includes(roleId) ? ids.filter((id) => id !== roleId) : [...ids, roleId]))
  }

  async function handleSaveRoles() {
    if (openId === null) return
    const outcome = await setRoles.mutateAsync({ userId: openId, roleIds: selectedRoleIds }).catch(() => null)
    if (!outcome) return
    const { added, removed } = outcome
    const summary = added.length || removed.length
      ? [added.length ? `+${added.length}` : '', removed.length ? `−${removed.length}` : ''].filter(Boolean).join(' ')
      : 'no change'
    showToast(`Roles updated (${summary})`)
    setView('detail')
  }

  return (
    <div className="relative h-full overflow-hidden bg-sunken">
      <UsersListView
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1) }}
        roleOptions={roleFilterOptions}
        filterRole={filterRole}
        onFilterRoleChange={(value) => { setFilterRole(value); setPage(1) }}
        baseRoleOptions={BASE_ROLE_FILTER_OPTIONS}
        filterBaseRole={filterBaseRole}
        onFilterBaseRoleChange={(value) => { setFilterBaseRole(value); setPage(1) }}
        resultLabel={resultLabel}
        kpis={kpis}
        loading={usersQuery.isPending}
        rows={rows}
        onRowClick={handleRowClick}
        empty={emptyContent}
        pageInfo={pageInfo}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        pageLabel={`Page ${page} of ${pageCount}`}
        prevDisabled={page <= 1}
        nextDisabled={page >= pageCount}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
      />

      {view === 'detail' && detailQuery.data && (
        <UserDetailView
          user={detailQuery.data}
          canEditRoles={canAssignRoles}
          onClose={handleCloseDetail}
          onEditRoles={handleEditRoles}
        />
      )}

      {view === 'roles' && detailQuery.data && (
        <UserRolesEditor
          user={detailQuery.data}
          roles={assignableRoles}
          rolesLoading={rolesQuery.isPending}
          selectedIds={selectedRoleIds}
          saving={setRoles.isPending}
          error={setRoles.isError ? (toFailure(setRoles.error)?.message ?? 'Could not save roles.') : null}
          onToggleRole={handleToggleRole}
          onCancel={() => setView('detail')}
          onSave={handleSaveRoles}
        />
      )}

      <UserToast show={toast.show} message={toast.message} />
    </div>
  )
}
