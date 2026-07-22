import { useEffect, useMemo, useRef, useState } from 'react'

import type { SelectOption } from '@/shared/ui'
import type { God } from '@/features/users-roles/domain/entities/god'
import type { UserStatus, User } from '@/features/users-roles/domain/entities/user'
import { ConfirmUserDialog, type ConfirmKind } from '@/features/users-roles/presentation/components/ConfirmUserDialog'
import { EmptyFilteredMessage } from '@/features/users-roles/presentation/components/EmptyFilteredMessage'
import { UserDetailView } from '@/features/users-roles/presentation/components/UserDetailView'
import { UserFormView, type UserFormErrors } from '@/features/users-roles/presentation/components/UserFormView'
import { UserToast } from '@/features/users-roles/presentation/components/UserToast'
import { UsersListView } from '@/features/users-roles/presentation/components/UsersListView'
import type { SortDir, SortKey, UserRow } from '@/features/users-roles/presentation/components/UsersTable'
import { GODS } from '@/features/users-roles/presentation/data/gods.mock'
import { ROLES } from '@/features/users-roles/presentation/data/roles.mock'
import { USERS } from '@/features/users-roles/presentation/data/users.mock'
import { todayISO } from '@/features/users-roles/presentation/utils/date'
import { buildStatusKpis } from '@/features/users-roles/presentation/utils/kpi'
import { findGodName, findRole, normalizePhone } from '@/features/users-roles/presentation/utils/roles'

const PAGE_SIZES = [20, 50, 100]
const ACTOR = 'Admin'

type ViewMode = 'list' | 'detail' | 'form'
type FormMode = 'add' | 'edit'

interface FormState {
  id: string | null
  name: string
  email: string
  phone: string
  avatar: string | null
  roleId: string
  status: UserStatus
  gods: string[]
}

function blankForm(): FormState {
  return { id: null, name: '', email: '', phone: '', avatar: null, roleId: '', status: 'Active', gods: [] }
}

const ROLE_OPTIONS: SelectOption[] = ROLES.map((r) => ({ value: r.id, label: r.label }))
const ROLE_FILTER_OPTIONS: SelectOption[] = [{ value: 'all', label: 'All roles' }, ...ROLE_OPTIONS]
const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]
const PAGE_SIZE_OPTIONS: SelectOption[] = PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} / page` }))

/** Users & Roles — the employee/login registry list, detail, and add/edit form. */
export function UsersRolesScreen() {
  const [users, setUsers] = useState<User[]>(USERS)

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [sortKey, setSortKey] = useState<SortKey | ''>('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [loading, setLoading] = useState(false)

  const [view, setView] = useState<ViewMode>('list')
  const [openId, setOpenId] = useState<string | null>(null)

  const [formMode, setFormMode] = useState<FormMode>('add')
  const [form, setForm] = useState<FormState>(blankForm())
  const [errors, setErrors] = useState<UserFormErrors>({})
  const [godPickerOpen, setGodPickerOpen] = useState(false)
  const formSignature = useRef<string | null>(null)

  const [confirm, setConfirm] = useState<{ open: boolean; kind: ConfirmKind | null }>({ open: false, kind: null })
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [],
  )

  function pulse() {
    setLoading(true)
    if (pulseTimer.current) clearTimeout(pulseTimer.current)
    pulseTimer.current = setTimeout(() => setLoading(false), 240)
  }

  function showToast(message: string) {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), 2400)
  }

  const godsList: readonly God[] = GODS

  const filtersActive = search.trim() !== '' || filterRole !== 'all' || filterStatus !== 'all'

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = users.filter((u) => {
      if (filterRole !== 'all' && u.roleId !== filterRole) return false
      if (filterStatus !== 'all' && u.status !== filterStatus) return false
      if (q) {
        const haystack = `${u.name} ${u.email} ${u.phone} ${findRole(u.roleId).label}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    base.sort((a, b) => a.name.localeCompare(b.name))
    return base
  }, [users, search, filterRole, filterStatus])

  const sortedUsers = useMemo(() => {
    if (!sortKey) return filteredUsers
    const sd = sortDir === 'desc' ? -1 : 1
    const sortValue = (u: User): string => {
      if (sortKey === 'roleLabel') return findRole(u.roleId).label
      if (sortKey === 'status') return u.status
      return u.name
    }
    return [...filteredUsers].sort((a, b) => sd * sortValue(a).localeCompare(sortValue(b), undefined, { numeric: true }))
  }, [filteredUsers, sortKey, sortDir])

  const total = sortedUsers.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount - 1)

  const pageRows: UserRow[] = useMemo(
    () =>
      sortedUsers.slice(currentPage * pageSize, currentPage * pageSize + pageSize).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        roleId: u.roleId,
        roleLabel: findRole(u.roleId).label,
        status: u.status,
      })),
    [sortedUsers, currentPage, pageSize],
  )

  const kpis = useMemo(() => buildStatusKpis(filteredUsers, 'users'), [filteredUsers])

  const resultLabel = filtersActive ? `${total} of ${users.length} users` : `${total} ${total === 1 ? 'user' : 'users'}`
  const pageInfo = total ? `Showing ${currentPage * pageSize + 1}–${Math.min(total, (currentPage + 1) * pageSize)} of ${total} users` : 'No users'
  const pageLabel = `Page ${currentPage + 1} of ${pageCount}`

  function handleClearFilters() {
    setSearch('')
    setFilterRole('all')
    setFilterStatus('all')
    setPage(0)
    pulse()
  }

  const emptyContent = filtersActive ? <EmptyFilteredMessage message="No users match your filters." onClearFilters={handleClearFilters} /> : 'No users yet.'

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(0)
    pulse()
  }
  function handleFilterRoleChange(value: string) {
    setFilterRole(value)
    setPage(0)
    pulse()
  }
  function handleFilterStatusChange(value: string) {
    setFilterStatus(value)
    setPage(0)
    pulse()
  }
  function handleSort(key: SortKey) {
    setSortDir((prevDir) => (sortKey === key && prevDir === 'asc' ? 'desc' : 'asc'))
    setSortKey(key)
    setPage(0)
  }
  function handlePrev() {
    setPage((p) => Math.max(0, p - 1))
  }
  function handleNext() {
    setPage((p) => Math.min(pageCount - 1, p + 1))
  }
  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setPage(0)
  }

  const openUser = users.find((u) => u.id === openId) ?? null
  const openRole = openUser ? findRole(openUser.roleId) : null

  function handleRowClick(row: UserRow) {
    setView('detail')
    setOpenId(row.id)
  }
  function handleCloseDetail() {
    setView('list')
    setOpenId(null)
  }

  function handleAdd() {
    const f = blankForm()
    formSignature.current = JSON.stringify(f)
    setForm(f)
    setFormMode('add')
    setErrors({})
    setGodPickerOpen(false)
    setView('form')
  }
  function handleEditUser() {
    if (!openUser) return
    const f: FormState = {
      id: openUser.id,
      name: openUser.name,
      email: openUser.email,
      phone: openUser.phone,
      avatar: openUser.avatar,
      roleId: openUser.roleId,
      status: openUser.status,
      gods: [...openUser.gods],
    }
    formSignature.current = JSON.stringify(f)
    setForm(f)
    setFormMode('edit')
    setErrors({})
    setGodPickerOpen(false)
    setView('form')
  }
  function handleCancelForm() {
    const dirty = formSignature.current !== null && JSON.stringify(form) !== formSignature.current
    if (dirty && !confirm.open) {
      setConfirm({ open: true, kind: 'discard' })
      return
    }
    formSignature.current = null
    setGodPickerOpen(false)
    if (formMode === 'edit' && form.id) {
      setView('detail')
      setOpenId(form.id)
    } else {
      setView('list')
    }
  }

  function setFormField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function handlePictureSelect(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setFormField('avatar', reader.result)
    }
    reader.readAsDataURL(file)
  }
  function handleRemovePicture() {
    setFormField('avatar', null)
  }
  function handleStatusToggle() {
    setForm((f) => ({ ...f, status: f.status === 'Active' ? 'Inactive' : 'Active' }))
  }
  function handleToggleGodPicker() {
    setGodPickerOpen((v) => !v)
  }
  function handleCloseGodPicker() {
    setGodPickerOpen(false)
  }
  function handleToggleGod(godId: string) {
    setForm((f) => {
      const has = f.gods.includes(godId)
      return { ...f, gods: has ? f.gods.filter((g) => g !== godId) : [...f.gods, godId] }
    })
  }
  function handleRemoveGod(godId: string) {
    setForm((f) => ({ ...f, gods: f.gods.filter((g) => g !== godId) }))
  }

  function handleSaveForm() {
    const nextErrors: UserFormErrors = {}
    const name = form.name.trim()
    if (!name) nextErrors.name = 'Name is required'
    const email = form.email.trim()
    if (!email) nextErrors.email = 'Email is required'
    else if (email.indexOf('@') < 1 || email.indexOf('.') < 0) nextErrors.email = 'Enter a valid email'
    else if (users.some((u) => u.id !== form.id && u.email.toLowerCase() === email.toLowerCase())) nextErrors.email = 'This email is already registered'
    const phone = form.phone.trim()
    if (!phone) nextErrors.phone = 'Phone is required'
    else if (users.some((u) => u.id !== form.id && normalizePhone(u.phone) === normalizePhone(phone))) nextErrors.phone = 'This phone is already registered'
    if (!form.roleId) nextErrors.roleId = 'Select a role'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const isPoojari = findRole(form.roleId).kind === 'poojari'
    const gods = isPoojari ? form.gods : []
    const today = todayISO()

    if (formMode === 'add') {
      let max = 0
      for (const u of users) {
        const n = parseInt(u.id.replace(/\D/g, ''), 10)
        if (n > max) max = n
      }
      const newUser: User = {
        id: `U-${max + 1}`,
        name,
        email,
        phone,
        avatar: form.avatar,
        roleId: form.roleId,
        status: form.status,
        gods,
        createdBy: ACTOR,
        createdAt: today,
        modifiedBy: ACTOR,
        modifiedAt: today,
        activity: 0,
        metrics: {},
      }
      setUsers((list) => [...list, newUser])
      setErrors({})
      formSignature.current = null
      setView('list')
      showToast('User added')
    } else {
      const id = form.id
      setUsers((list) =>
        list.map((u) => (u.id === id ? { ...u, name, email, phone, avatar: form.avatar, roleId: form.roleId, status: form.status, gods, modifiedBy: ACTOR, modifiedAt: today } : u)),
      )
      setErrors({})
      formSignature.current = null
      setView('detail')
      setOpenId(id)
      showToast('User updated')
    }
  }

  function handleAskDeactivate() {
    setConfirm({ open: true, kind: 'deactivate' })
  }
  function handleReactivate() {
    const id = openId
    const name = openUser?.name ?? 'User'
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, status: 'Active', modifiedBy: ACTOR, modifiedAt: todayISO() } : u)))
    showToast(`${name} reactivated`)
  }
  function handleAskDelete() {
    setConfirm({ open: true, kind: 'delete' })
  }
  function handleConfirmNo() {
    setConfirm({ open: false, kind: null })
  }
  function handleConfirmYes() {
    if (confirm.kind === 'discard') {
      formSignature.current = null
      setGodPickerOpen(false)
      if (formMode === 'edit' && form.id) {
        setView('detail')
        setOpenId(form.id)
      } else {
        setView('list')
      }
      setConfirm({ open: false, kind: null })
      return
    }
    const id = openId
    const name = openUser?.name ?? 'User'
    if (confirm.kind === 'deactivate') {
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, status: 'Inactive', modifiedBy: ACTOR, modifiedAt: todayISO() } : u)))
      setConfirm({ open: false, kind: null })
      showToast(`${name} deactivated`)
    } else if (confirm.kind === 'delete') {
      setUsers((list) => list.filter((u) => u.id !== id))
      setConfirm({ open: false, kind: null })
      setView('list')
      setOpenId(null)
      showToast(`${name} deleted`)
    } else {
      setConfirm({ open: false, kind: null })
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirm.open) {
        handleConfirmNo()
        return
      }
      if (godPickerOpen) {
        handleCloseGodPicker()
        return
      }
      if (view === 'form') {
        handleCancelForm()
        return
      }
      if (view === 'detail') {
        handleCloseDetail()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm.open, godPickerOpen, view, form])

  const chosenRole = form.roleId ? findRole(form.roleId) : null
  const formTitle = formMode === 'add' ? 'Add user' : `Edit · ${form.name || 'user'}`
  const saveLabel = formMode === 'add' ? 'Add user' : 'Save changes'
  const godNames = openUser ? openUser.gods.map((g) => findGodName(godsList, g)) : []

  return (
    <div className="relative h-full overflow-hidden bg-sunken">
      <UsersListView
        onAdd={handleAdd}
        search={search}
        onSearchChange={handleSearchChange}
        roleOptions={ROLE_FILTER_OPTIONS}
        filterRole={filterRole}
        onFilterRoleChange={handleFilterRoleChange}
        statusOptions={STATUS_FILTER_OPTIONS}
        filterStatus={filterStatus}
        onFilterStatusChange={handleFilterStatusChange}
        resultLabel={resultLabel}
        kpis={kpis}
        loading={loading}
        rows={pageRows}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onRowClick={handleRowClick}
        empty={emptyContent}
        pageInfo={pageInfo}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        pageLabel={pageLabel}
        prevDisabled={currentPage <= 0}
        nextDisabled={currentPage >= pageCount - 1}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {view === 'detail' && openUser && openRole && (
        <UserDetailView
          user={openUser}
          role={openRole}
          godNames={godNames}
          onClose={handleCloseDetail}
          onEdit={handleEditUser}
          onDeactivate={handleAskDeactivate}
          onReactivate={handleReactivate}
          onDelete={handleAskDelete}
        />
      )}

      {view === 'form' && (
        <UserFormView
          title={formTitle}
          saveLabel={saveLabel}
          values={form}
          errors={errors}
          roleOptions={ROLE_OPTIONS}
          chosenRole={chosenRole}
          gods={godsList}
          godPickerOpen={godPickerOpen}
          onCancel={handleCancelForm}
          onSave={handleSaveForm}
          onNameChange={(v) => setFormField('name', v)}
          onEmailChange={(v) => setFormField('email', v)}
          onPhoneChange={(v) => setFormField('phone', v)}
          onStatusToggle={handleStatusToggle}
          onPictureSelect={handlePictureSelect}
          onRemovePicture={handleRemovePicture}
          onRoleChange={(v) => setFormField('roleId', v)}
          onToggleGodPicker={handleToggleGodPicker}
          onCloseGodPicker={handleCloseGodPicker}
          onToggleGod={handleToggleGod}
          onRemoveGod={handleRemoveGod}
        />
      )}

      <ConfirmUserDialog open={confirm.open} kind={confirm.kind} onConfirm={handleConfirmYes} onCancel={handleConfirmNo} />
      <UserToast show={toast.show} message={toast.message} />
    </div>
  )
}
