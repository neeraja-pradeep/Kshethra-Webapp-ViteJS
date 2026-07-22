import { useEffect, useMemo, useRef, useState } from 'react'

import { Spinner } from '@/shared/ui'

import type { Devotee } from '@/features/devotees/domain/entities/devotee'
import { DEVOTEES } from '@/features/devotees/presentation/data/devotees.mock'
import { filterDevotees, sortDevotees } from '@/features/devotees/presentation/lib/filterSort'
import type { DevoteeSortKey, DevoteeStatusFilter, SortDirection } from '@/features/devotees/presentation/lib/filterSort'
import { computeDevoteeKpis } from '@/features/devotees/presentation/lib/kpis'

import { DevoteeConfirmDialog } from '@/features/devotees/presentation/components/DevoteeConfirmDialog'
import type { DevoteeConfirmKind } from '@/features/devotees/presentation/components/DevoteeConfirmDialog'
import { DevoteeDetailPanel } from '@/features/devotees/presentation/components/DevoteeDetailPanel'
import type { EditFamilyMember } from '@/features/devotees/presentation/components/DevoteeFamilyCard'
import { DevoteeToast } from '@/features/devotees/presentation/components/DevoteeToast'
import { DevoteesEmptyState } from '@/features/devotees/presentation/components/DevoteesEmptyState'
import { DevoteesFilterBar } from '@/features/devotees/presentation/components/DevoteesFilterBar'
import { DevoteesKpiBand } from '@/features/devotees/presentation/components/DevoteesKpiBand'
import { DevoteesPagination } from '@/features/devotees/presentation/components/DevoteesPagination'
import { DevoteesTable } from '@/features/devotees/presentation/components/DevoteesTable'

interface EditState {
  phone: string
  email: string
  family: EditFamilyMember[]
}

const PULSE_MS = 260
const TOAST_MS = 2400

/** Devotees — app user accounts list with a view/edit account detail overlay. */
export function DevoteesScreen() {
  const [devotees, setDevotees] = useState<Devotee[]>(DEVOTEES)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<DevoteeStatusFilter>('all')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [sortKey, setSortKey] = useState<DevoteeSortKey | ''>('')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [loading, setLoading] = useState(false)

  const [openId, setOpenId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [edit, setEdit] = useState<EditState | null>(null)
  const famSeqRef = useRef(0)
  const editSignatureRef = useRef<string | null>(null)

  const [confirmKind, setConfirmKind] = useState<DevoteeConfirmKind | null>(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pulse = () => {
    setLoading(true)
    if (pulseTimer.current) clearTimeout(pulseTimer.current)
    pulseTimer.current = setTimeout(() => setLoading(false), PULSE_MS)
  }

  useEffect(() => {
    pulse()
    return () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = (message: string) => {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_MS)
  }

  // Escape closes the top-most layer: confirm dialog, then edit mode, then the detail overlay.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (confirmKind) return handleConfirmNo()
      if (editMode) return handleCancelEdit()
      if (openId) return handleCloseDetail()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmKind, editMode, openId, edit])

  const filtered = useMemo(() => filterDevotees(devotees, search, filterStatus), [devotees, search, filterStatus])
  const kpis = useMemo(() => computeDevoteeKpis(filtered), [filtered])
  const sorted = useMemo(() => sortDevotees(filtered, sortKey, sortDir), [filtered, sortKey, sortDir])

  const total = sorted.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize)
  const openDevotee = devotees.find((d) => d.id === openId) ?? null
  const isFiltered = search.trim() !== '' || filterStatus !== 'all'

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(0)
    pulse()
  }

  function handleStatusFilterChange(value: DevoteeStatusFilter) {
    setFilterStatus(value)
    setPage(0)
    pulse()
  }

  function handleClearFilters() {
    setSearch('')
    setFilterStatus('all')
    setPage(0)
    pulse()
  }

  function handleSort(key: DevoteeSortKey) {
    setSortDir((dir) => (sortKey === key && dir === 'asc' ? 'desc' : 'asc'))
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

  function handleRowClick(row: Devotee) {
    setOpenId(row.id)
    setEditMode(false)
    setEdit(null)
  }

  function handleCloseDetail() {
    setOpenId(null)
    setEditMode(false)
    setEdit(null)
  }

  function handleEdit() {
    if (!openDevotee) return
    const initial: EditState = {
      phone: openDevotee.phone,
      email: openDevotee.email,
      family: openDevotee.family.map((m, i) => ({ id: `F${i}`, name: m.name, nakshatra: m.nakshatra })),
    }
    famSeqRef.current = openDevotee.family.length
    editSignatureRef.current = JSON.stringify(initial)
    setEdit(initial)
    setEditMode(true)
  }

  function handleCancelEdit() {
    if (editSignatureRef.current && edit && JSON.stringify(edit) !== editSignatureRef.current && !confirmKind) {
      setConfirmKind('discard')
      return
    }
    editSignatureRef.current = null
    setEditMode(false)
    setEdit(null)
  }

  function handleEditPhoneChange(value: string) {
    setEdit((e) => (e ? { ...e, phone: value } : e))
  }

  function handleEditEmailChange(value: string) {
    setEdit((e) => (e ? { ...e, email: value } : e))
  }

  function handleFamilyNameChange(id: string, name: string) {
    setEdit((e) => (e ? { ...e, family: e.family.map((m) => (m.id === id ? { ...m, name } : m)) } : e))
  }

  function handleFamilyNakshatraChange(id: string, nakshatra: string) {
    setEdit((e) => (e ? { ...e, family: e.family.map((m) => (m.id === id ? { ...m, nakshatra } : m)) } : e))
  }

  function handleRemoveFamilyMember(id: string) {
    setEdit((e) => (e ? { ...e, family: e.family.filter((m) => m.id !== id) } : e))
  }

  function handleAddFamilyMember() {
    const id = `F${famSeqRef.current}`
    famSeqRef.current += 1
    setEdit((e) => (e ? { ...e, family: [...e.family, { id, name: '', nakshatra: '' }] } : e))
  }

  function handleSave() {
    if (!openId || !edit) return
    const family = edit.family.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), nakshatra: m.nakshatra }))
    setDevotees((rows) => rows.map((d) => (d.id === openId ? { ...d, phone: edit.phone, email: edit.email, family } : d)))
    editSignatureRef.current = null
    setEditMode(false)
    setEdit(null)
    showToast('Account updated')
  }

  function handleAskSuspend() {
    setConfirmKind('suspend')
  }

  function handleReactivate() {
    if (!openId) return
    setDevotees((rows) => rows.map((d) => (d.id === openId ? { ...d, status: 'Active' } : d)))
    showToast('Account reactivated')
  }

  function handleAskDelete() {
    setConfirmKind('delete')
  }

  function handleConfirmNo() {
    setConfirmKind(null)
  }

  function handleConfirmYes() {
    if (confirmKind === 'discard') {
      editSignatureRef.current = null
      setEditMode(false)
      setEdit(null)
      setConfirmKind(null)
      return
    }
    if (confirmKind === 'suspend') {
      const name = openDevotee?.name ?? 'Account'
      setDevotees((rows) => rows.map((d) => (d.id === openId ? { ...d, status: 'Suspended' } : d)))
      setConfirmKind(null)
      showToast(`${name} suspended`)
      return
    }
    if (confirmKind === 'delete') {
      const name = openDevotee?.name ?? 'Account'
      setDevotees((rows) => rows.filter((d) => d.id !== openId))
      setConfirmKind(null)
      setOpenId(null)
      setEditMode(false)
      setEdit(null)
      showToast(`${name} deleted`)
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-start gap-4 px-7 pt-6 pb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-heading tracking-title leading-tight text-ink-strong">Devotees</h1>
            <p className="mt-1.5 text-sm text-ink-muted">App user accounts. Accounts are created by devotees in the app.</p>
          </div>
        </div>

        <DevoteesFilterBar search={search} onSearchChange={handleSearchChange} status={filterStatus} onStatusChange={handleStatusFilterChange} />

        <DevoteesKpiBand items={kpis} />

        {loading && (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Spinner size={40} />
          </div>
        )}

        {!loading && (
          <>
            <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
              <div className="min-h-0 flex-1 overflow-auto">
                <DevoteesTable
                  rows={pageRows}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  onRowClick={handleRowClick}
                  empty={<DevoteesEmptyState filtered={isFiltered} onClearFilters={handleClearFilters} />}
                />
              </div>
            </div>

            <DevoteesPagination
              total={total}
              page={currentPage}
              pageCount={pageCount}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </>
        )}
      </div>

      {openDevotee && (
        <DevoteeDetailPanel
          devotee={openDevotee}
          editing={editMode}
          editPhone={edit?.phone ?? ''}
          editEmail={edit?.email ?? ''}
          editFamily={edit?.family ?? []}
          onBack={handleCloseDetail}
          onEdit={handleEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
          onEditPhoneChange={handleEditPhoneChange}
          onEditEmailChange={handleEditEmailChange}
          onFamilyNameChange={handleFamilyNameChange}
          onFamilyNakshatraChange={handleFamilyNakshatraChange}
          onRemoveFamilyMember={handleRemoveFamilyMember}
          onAddFamilyMember={handleAddFamilyMember}
          onSuspend={handleAskSuspend}
          onReactivate={handleReactivate}
          onDelete={handleAskDelete}
        />
      )}

      <DevoteeConfirmDialog kind={confirmKind} onConfirm={handleConfirmYes} onCancel={handleConfirmNo} />
      <DevoteeToast show={toast.show} message={toast.message} />
    </div>
  )
}
