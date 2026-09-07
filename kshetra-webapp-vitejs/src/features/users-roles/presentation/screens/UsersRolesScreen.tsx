import { useEffect, useMemo, useRef, useState } from 'react'

import { toFailure, toFieldErrors } from '@/core/error/result'
import { Tabs, type SelectOption } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan, useCanAll } from '@/features/auth/application/hooks/useCan'
import {
  useActivateStaffUserMutation,
  useAssignRoleToUsersMutation,
  useCreateRoleMutation,
  useCreateStaffUserMutation,
  useDeactivateStaffUserMutation,
  useDeleteRoleMutation,
  useSetPoojariGodsMutation,
  useSetUserRolesMutation,
  useSetStaffUserPasswordMutation,
  useUnassignRoleFromUsersMutation,
  useUpdateRoleMutation,
  useUpdateStaffUserMutation,
} from '@/features/rbac/application/queries/useRbacMutations'
import {
  useAssignableBaseRolesQuery,
  useGodOptionsQuery,
  usePermissionCatalogueQuery,
  usePoojariGodsQuery,
  useRbacUserQuery,
  useRbacUsersQuery,
  useRoleQuery,
  useRoleUsersQuery,
  useRolesQuery,
} from '@/features/rbac/application/queries/useRbacQueries'
import type { RbacRole } from '@/features/rbac/domain/entities/rbac-role'
import { isAssignable } from '@/features/rbac/domain/entities/rbac-role'
import { DeleteRoleDialog, type DeleteRoleStage } from '@/features/rbac/presentation/components/DeleteRoleDialog'
import { RoleBuilderView } from '@/features/rbac/presentation/components/RoleBuilderView'
import { RoleMembersView } from '@/features/rbac/presentation/components/RoleMembersView'
import { StaffUserFormView } from '@/features/rbac/presentation/components/StaffUserFormView'
import {
  blankStaffUser,
  staffUserFromRecord,
  type StaffUserFormValues,
} from '@/features/rbac/presentation/lib/staffUserForm'
import { POOJARI_ROLE } from '@/features/rbac/presentation/lib/staffUserForm'
import { StaffUserLifecycle } from '@/features/rbac/presentation/components/StaffUserLifecycle'
import { RolesTabView } from '@/features/rbac/presentation/components/RolesTabView'
import { EmptyFilteredMessage } from '@/features/users-roles/presentation/components/EmptyFilteredMessage'
import { ConfirmUserDialog, type ConfirmKind } from '@/features/users-roles/presentation/components/ConfirmUserDialog'
import { PoojariShrinesPanel } from '@/features/users-roles/presentation/components/PoojariShrinesPanel'
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
/** Only used before `assignable-roles/` answers; the dropdown replaces it. */
const DEFAULT_BASE_ROLE = 'counter_staff'

type Tab = 'users' | 'roles'
type ViewMode = 'list' | 'detail' | 'userRoles' | 'userForm'
/** `null` role id in the builder means "creating". */
type RoleView = { kind: 'list' } | { kind: 'builder'; roleId: number | null }

/**
 * Users & Roles — the login registry and the role catalogue, backed by `rbac/`.
 *
 * Two tabs because they are two jobs against one API: who works here, and what
 * a role may do. They share a screen so the permission split stays visible —
 * `assign_roles` reaches both tabs, while `manage_roles` and `manage_users`
 * each unlock only the authoring controls on their own side.
 *
 * Search, role and base-role filters and pagination are all server-side; the
 * screen holds no copy of either list.
 */
export function UsersRolesScreen() {
  const can = useCan()
  const canAssignRoles = can(PERMISSIONS.assignRoles)
  const canManageRoles = can(PERMISSIONS.manageRoles)
  const canCreateUser = useCanAll([PERMISSIONS.manageUsers, PERMISSIONS.addCustomuser])
  /** Editing, deactivating and reactivating all ask for `change`, never `delete`. */
  const canEditUser = useCanAll([PERMISSIONS.manageUsers, PERMISSIONS.changeCustomuser])
  /** Reading a roster and deciding somebody's workload are separate permissions. */
  const canViewShrines = can(PERMISSIONS.managePoojaris)
  const canEditShrines = can(PERMISSIONS.managePoojariGods)

  const [tab, setTab] = useState<Tab>('users')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterRole, setFilterRole] = useState(ALL)
  const [filterBaseRole, setFilterBaseRole] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  /** Built-ins are noise in the catalogue until you need them, so default to hiding them. */
  const [customOnly, setCustomOnly] = useState(true)
  const [rolePage, setRolePage] = useState(1)
  const [rolePageSize, setRolePageSize] = useState(DEFAULT_PAGE_SIZE)

  const [roleView, setRoleView] = useState<RoleView>({ kind: 'list' })
  const [deleteStage, setDeleteStage] = useState<DeleteRoleStage>({ kind: 'closed' })
  const [membersOpen, setMembersOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [userForm, setUserForm] = useState<StaffUserFormValues | null>(null)
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null)

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

  /** The Roles tab's own page of the catalogue — built-ins included when asked for. */
  const roleListQuery = useRolesQuery({ customOnly, page: rolePage, pageSize: rolePageSize })

  const detailQuery = useRbacUserQuery(view === 'list' ? null : openId)
  const setRoles = useSetUserRolesMutation()

  /**
   * Shrines, for a poojari account only.
   *
   * Gated on the base role because the endpoint 404s on anybody else — asking
   * for a clerk's shrine list would surface an error for a card that should
   * simply not be drawn.
   */
  const isPoojari = detailQuery.data?.baseRole === POOJARI_ROLE
  const shrinesEnabled = view === 'detail' && isPoojari && canViewShrines
  const poojariGodsQuery = usePoojariGodsQuery(openId, shrinesEnabled)
  const godOptionsQuery = useGodOptionsQuery(shrinesEnabled && canEditShrines)
  const setShrines = useSetPoojariGodsMutation()

  /**
   * The whole catalogue, unfiltered and fetched once.
   *
   * `usePermissionCatalogueQuery` keys on its search term, so passing one
   * through would leave the builder holding a partial catalogue — and the
   * dangerous-permission check reads from it. Search filters client-side.
   */
  const catalogueQuery = usePermissionCatalogueQuery()
  const editingRoleQuery = useRoleQuery(roleView.kind === 'builder' ? roleView.roleId : null)
  const createRole = useCreateRoleMutation()
  const updateRole = useUpdateRoleMutation()
  const deleteRole = useDeleteRoleMutation()
  const createStaffUser = useCreateStaffUserMutation()
  const updateStaffUser = useUpdateStaffUserMutation()
  const deactivateStaffUser = useDeactivateStaffUserMutation()
  const activateStaffUser = useActivateStaffUserMutation()
  const setStaffPassword = useSetStaffUserPasswordMutation()
  /** Needs `manage_users`; gated so an assign-only supervisor never 403s. */
  const baseRolesQuery = useAssignableBaseRolesQuery(canCreateUser || canEditUser)
  const assignRoleToUsers = useAssignRoleToUsersMutation()
  const unassignRoleFromUsers = useUnassignRoleFromUsersMutation()

  const editingRole = editingRoleQuery.data ?? null
  const membersQuery = useRoleUsersQuery(membersOpen ? (editingRole?.id ?? null) : null)
  const candidatesQuery = useRbacUsersQuery(
    memberSearch ? { search: memberSearch, pageSize: 20 } : { pageSize: 20 },
  )

  const roleFilterOptions: SelectOption[] = useMemo(
    () => [
      { value: ALL, label: 'All roles' },
      ...(rolesQuery.data?.results ?? []).map((role) => ({ value: role.name, label: role.label })),
    ],
    [rolesQuery.data],
  )

  const total = usersQuery.data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const roleTotal = roleListQuery.data?.count ?? 0
  const rolePageCount = Math.max(1, Math.ceil(roleTotal / rolePageSize))

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

  const roleKpis: readonly KpiItem[] = useMemo(
    () => [
      { key: 'roles', value: String(roleTotal), label: roleTotal === 1 ? 'role' : 'roles' },
      {
        key: 'assigned',
        value: String((roleListQuery.data?.results ?? []).reduce((sum, role) => sum + role.userCount, 0)),
        label: 'assignments on this page',
      },
    ],
    [roleTotal, roleListQuery.data],
  )

  const filtersActive = debouncedSearch !== '' || filterRole !== ALL || filterBaseRole !== ALL
  const resultLabel = filtersActive ? `${total} matching` : `${total} ${total === 1 ? 'user' : 'users'}`
  const firstOnPage = total === 0 ? 0 : (page - 1) * pageSize + 1
  const pageInfo = total ? `Showing ${firstOnPage}–${Math.min(total, page * pageSize)} of ${total} users` : 'No users'

  const firstRoleOnPage = roleTotal === 0 ? 0 : (rolePage - 1) * rolePageSize + 1
  const rolePageInfo = roleTotal
    ? `Showing ${firstRoleOnPage}–${Math.min(roleTotal, rolePage * rolePageSize)} of ${roleTotal} roles`
    : 'No roles'

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

  const roleLoadError = roleListQuery.isError
    ? (toFailure(roleListQuery.error)?.message ?? 'Could not load roles.')
    : null
  const roleEmptyContent = roleLoadError ?? (customOnly
    ? 'No custom roles yet. The built-in roles are hidden — turn the filter off to see them.'
    : 'No roles.')

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
    setView('userRoles')
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

  /**
   * The server answers a delete with either "gone" or "still assigned to N".
   * The second is a question, not a failure — the repository already models it
   * that way — so it moves the dialog to its second step instead of erroring.
   */
  async function handleDeleteRole(force: boolean) {
    if (!editingRole) return
    const outcome = await deleteRole.mutateAsync({ id: editingRole.id, force }).catch(() => null)
    if (!outcome) return
    if (outcome.kind === 'stillAssigned') {
      setDeleteStage({ kind: 'stillAssigned', detail: outcome.detail, userCount: outcome.userCount })
      return
    }
    setDeleteStage({ kind: 'closed' })
    setRoleView({ kind: 'list' })
    showToast(`${editingRole.label} deleted`)
  }

  async function handleAddMembers(userIds: readonly number[]) {
    if (!editingRole) return
    const done = await assignRoleToUsers.mutateAsync({ roleId: editingRole.id, userIds }).catch(() => null)
    if (done) showToast(`${editingRole.label} given to ${userIds.length}`)
  }

  async function handleRemoveMembers(userIds: readonly number[]) {
    if (!editingRole) return
    const done = await unassignRoleFromUsers.mutateAsync({ roleId: editingRole.id, userIds }).catch(() => null)
    if (done) showToast(`${editingRole.label} removed from ${userIds.length}`)
  }


  function handleCreateUser() {
    createStaffUser.reset()
    updateStaffUser.reset()
    setUserForm(blankStaffUser(baseRolesQuery.data?.[0]?.name ?? DEFAULT_BASE_ROLE))
    setOpenId(null)
    setView('userForm')
  }

  function handleEditUser() {
    if (!detailQuery.data) return
    createStaffUser.reset()
    updateStaffUser.reset()
    setUserForm(staffUserFromRecord(detailQuery.data))
    setView('userForm')
  }

  async function handleSaveUser() {
    if (!userForm) return
    const creating = openId === null
    const saved = creating
      ? await createStaffUser.mutateAsync({
          username: userForm.username.trim(),
          password: userForm.password,
          role: userForm.role,
          email: userForm.email.trim(),
          phoneNumber: userForm.phoneNumber.trim(),
          firstName: userForm.firstName.trim(),
          lastName: userForm.lastName.trim(),
          isActive: userForm.isActive,
          employeeId: userForm.employeeId.trim(),
        }).catch(() => null)
      : await updateStaffUser.mutateAsync({
          id: openId,
          changes: {
            role: userForm.role,
            email: userForm.email.trim(),
            phoneNumber: userForm.phoneNumber.trim(),
            // Omitted when blank, never sent as "". The registry does not
            // return names, so the edit form seeds them empty — sending that
            // would erase a real name the console cannot even display.
            ...(userForm.firstName.trim() ? { firstName: userForm.firstName.trim() } : {}),
            ...(userForm.lastName.trim() ? { lastName: userForm.lastName.trim() } : {}),
            isActive: userForm.isActive,
          },
        }).catch(() => null)

    if (!saved) return
    setUserForm(null)
    setOpenId(saved.id)
    setView('detail')
    showToast(`${saved.username} ${creating ? 'created' : 'saved'}`)
  }

  async function handleConfirmLifecycle() {
    if (openId === null || !confirmKind) return
    const kind = confirmKind
    setConfirmKind(null)
    if (kind === 'discard') return
    const done = kind === 'deactivate'
      ? await deactivateStaffUser.mutateAsync(openId).catch(() => null)
      : await activateStaffUser.mutateAsync(openId).catch(() => null)
    if (done) showToast(`${done.username} ${kind === 'deactivate' ? 'deactivated' : 'reactivated'}`)
  }

  async function handleSetPassword(password: string) {
    if (openId === null) return
    const done = await setStaffPassword.mutateAsync({ id: openId, password }).catch(() => null)
    if (done) showToast(`Password set for ${done.username}`)
  }

  function handleOpenRole(role: RbacRole) {
    createRole.reset()
    updateRole.reset()
    setRoleView({ kind: 'builder', roleId: role.id })
  }

  function handleCreateRole() {
    createRole.reset()
    updateRole.reset()
    setRoleView({ kind: 'builder', roleId: null })
  }

  async function handleSaveRole(input: {
    name: string
    label: string
    description: string
    isActive: boolean
    permissions: readonly string[]
  }) {
    const editingId = roleView.kind === 'builder' ? roleView.roleId : null
    // `permissions` is always the full resulting set: PATCH replaces rather
    // than merges, so a delta would wipe everything left out of it.
    const saved = editingId === null
      ? await createRole.mutateAsync({
          name: input.name,
          label: input.label,
          description: input.description,
          permissions: input.permissions,
          isActive: input.isActive,
        }).catch(() => null)
      : await updateRole.mutateAsync({
          id: editingId,
          changes: {
            label: input.label,
            description: input.description,
            permissions: input.permissions,
            isActive: input.isActive,
          },
        }).catch(() => null)

    if (!saved) return
    setRoleView({ kind: 'list' })
    showToast(`${saved.label} ${editingId === null ? 'created' : 'saved'} · ${saved.permissionCount} permissions`)
  }

  /** The Roles tab needs `assign_roles`; without it the server refuses the list. */
  const tabs = [
    { id: 'users', label: 'Users' },
    ...(canAssignRoles ? [{ id: 'roles', label: 'Roles' }] : []),
  ]

  return (
    <div className="relative h-full overflow-hidden bg-sunken">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-shrink-0 flex-col gap-3.5 px-7 pt-6">
          <div className="min-w-0">
            <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Users &amp; Roles</h1>
            <p className="m-0 mt-1.5 text-sm text-ink-muted">
              Login registry and role catalogue. Permissions come from the base role plus any assigned roles.
            </p>
          </div>
          <Tabs items={tabs} value={tab} onChange={(id) => setTab(id as Tab)} />
        </div>

        {tab === 'users' ? (
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
            canCreate={canCreateUser}
            onCreate={handleCreateUser}
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
        ) : (
          <RolesTabView
            customOnly={customOnly}
            onCustomOnlyChange={(value) => { setCustomOnly(value); setRolePage(1) }}
            resultLabel={`${roleTotal} ${roleTotal === 1 ? 'role' : 'roles'}`}
            kpis={roleKpis}
            canCreate={canManageRoles}
            onCreate={handleCreateRole}
            loading={roleListQuery.isPending}
            rows={roleListQuery.data?.results ?? []}
            onRowClick={handleOpenRole}
            empty={roleEmptyContent}
            pageInfo={rolePageInfo}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pageSize={rolePageSize}
            onPageSizeChange={(size) => { setRolePageSize(size); setRolePage(1) }}
            pageLabel={`Page ${rolePage} of ${rolePageCount}`}
            prevDisabled={rolePage <= 1}
            nextDisabled={rolePage >= rolePageCount}
            onPrev={() => setRolePage((p) => Math.max(1, p - 1))}
            onNext={() => setRolePage((p) => Math.min(rolePageCount, p + 1))}
          />
        )}
      </div>

      {view === 'detail' && detailQuery.data && (
        <UserDetailView
          user={detailQuery.data}
          canEditRoles={canAssignRoles}
          canEditUser={canEditUser}
          onClose={handleCloseDetail}
          onEditRoles={handleEditRoles}
          onEditUser={handleEditUser}
          shrines={
            shrinesEnabled ? (
              <PoojariShrinesPanel
                gods={poojariGodsQuery.data ?? null}
                options={godOptionsQuery.data ?? []}
                loading={poojariGodsQuery.isPending}
                optionsLoading={godOptionsQuery.isPending}
                saving={setShrines.isPending}
                canEdit={canEditShrines}
                error={
                  poojariGodsQuery.isError
                    ? (toFailure(poojariGodsQuery.error)?.message ?? 'The shrine list could not be loaded.')
                    : setShrines.isError
                      ? (toFailure(setShrines.error)?.message ?? 'The shrine list could not be saved.')
                      : null
                }
                onSave={(godIds) =>
                  setShrines.mutate({
                    userId: detailQuery.data.id,
                    godIds,
                    poojariName: detailQuery.data.username,
                  })
                }
              />
            ) : undefined
          }
          lifecycle={
            <StaffUserLifecycle
              user={detailQuery.data}
              busy={deactivateStaffUser.isPending || activateStaffUser.isPending || setStaffPassword.isPending}
              canManage={canEditUser}
              onDeactivate={() => setConfirmKind('deactivate')}
              onActivate={() => setConfirmKind('reactivate')}
              onSetPassword={handleSetPassword}
            />
          }
        />
      )}

      {view === 'userRoles' && detailQuery.data && (
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

      {roleView.kind === 'builder' && catalogueQuery.data && (roleView.roleId === null || editingRoleQuery.data) && (
        <RoleBuilderView
          // Remount on a different role so the draft seeds once from fresh data
          // instead of being reconciled against it.
          key={roleView.roleId ?? 'new'}
          role={editingRoleQuery.data ?? null}
          catalogue={catalogueQuery.data}
          saving={createRole.isPending || updateRole.isPending}
          error={
            toFailure(createRole.error)?.message ??
            toFailure(updateRole.error)?.message ??
            null
          }
          onCancel={() => setRoleView({ kind: 'list' })}
          onManageMembers={() => setMembersOpen(true)}
          // Built-ins refuse deletion with a 400, so the control never appears
          // rather than appearing and failing.
          onDelete={
            canManageRoles && editingRole && !editingRole.isSystem
              ? () => setDeleteStage({ kind: 'confirm' })
              : null
          }
          onSave={handleSaveRole}
        />
      )}

      {roleView.kind === 'builder' && editingRole && (
        <DeleteRoleDialog
          stage={deleteStage}
          roleLabel={editingRole.label}
          deleting={deleteRole.isPending}
          onCancel={() => setDeleteStage({ kind: 'closed' })}
          onConfirm={handleDeleteRole}
        />
      )}

      {membersOpen && editingRole && (
        <RoleMembersView
          roleLabel={editingRole.label}
          assignable={isAssignable(editingRole)}
          members={membersQuery.data?.results ?? []}
          membersLoading={membersQuery.isPending}
          candidates={candidatesQuery.data?.results ?? []}
          candidatesLoading={candidatesQuery.isPending}
          search={memberSearch}
          onSearchChange={setMemberSearch}
          busy={assignRoleToUsers.isPending || unassignRoleFromUsers.isPending}
          error={
            toFailure(assignRoleToUsers.error)?.message ??
            toFailure(unassignRoleFromUsers.error)?.message ??
            null
          }
          onClose={() => { setMembersOpen(false); setMemberSearch('') }}
          onAdd={handleAddMembers}
          onRemove={handleRemoveMembers}
        />
      )}

      {view === 'userForm' && userForm && (
        <StaffUserFormView
          user={openId === null ? null : (detailQuery.data ?? null)}
          values={userForm}
          baseRoles={baseRolesQuery.data ?? []}
          baseRolesLoading={baseRolesQuery.isPending}
          saving={createStaffUser.isPending || updateStaffUser.isPending}
          error={
            toFailure(createStaffUser.error)?.message ??
            toFailure(updateStaffUser.error)?.message ??
            null
          }
          fieldErrors={toFieldErrors(createStaffUser.error ?? updateStaffUser.error) ?? {}}
          onChange={setUserForm}
          onCancel={() => { setUserForm(null); setView(openId === null ? 'list' : 'detail') }}
          onSave={handleSaveUser}
        />
      )}

      <ConfirmUserDialog
        open={confirmKind !== null}
        kind={confirmKind}
        onConfirm={handleConfirmLifecycle}
        onCancel={() => setConfirmKind(null)}
      />

      <UserToast show={toast.show} message={toast.message} />
    </div>
  )
}
