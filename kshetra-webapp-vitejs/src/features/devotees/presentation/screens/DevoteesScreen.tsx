import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toFailure } from '@/core/error/result'
import { Alert, Icon, Spinner } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import { useDevoteeStatusMutation } from '@/features/devotees/application/queries/useDevoteeMutations'
import { useDevoteeQuery, useDevoteesQuery } from '@/features/devotees/application/queries/useDevoteesQuery'
import type { Devotee } from '@/features/devotees/domain/entities/devotee'
import type { DevoteeFilters } from '@/features/devotees/domain/repositories/devotee.repository'
import { DevoteeConfirmDialog } from '@/features/devotees/presentation/components/DevoteeConfirmDialog'
import type { DevoteeConfirmKind } from '@/features/devotees/presentation/components/DevoteeConfirmDialog'
import { DevoteeDetailPanel } from '@/features/devotees/presentation/components/DevoteeDetailPanel'
import { DevoteeToast } from '@/features/devotees/presentation/components/DevoteeToast'
import { DevoteesEmptyState } from '@/features/devotees/presentation/components/DevoteesEmptyState'
import { DevoteesFilterBar } from '@/features/devotees/presentation/components/DevoteesFilterBar'
import { DevoteesKpiBand } from '@/features/devotees/presentation/components/DevoteesKpiBand'
import { DevoteesPagination } from '@/features/devotees/presentation/components/DevoteesPagination'
import { DevoteesTable } from '@/features/devotees/presentation/components/DevoteesTable'
import {
  ALL_STATUSES,
  ORDERING_PARAM,
  type DevoteeSortKey,
  type DevoteeStatusFilter,
  type SortDirection,
} from '@/features/devotees/presentation/lib/sort'

const DEFAULT_PAGE_SIZE = 20
/** One request per pause in typing, not per keystroke. */
const SEARCH_DEBOUNCE_MS = 300
const TOAST_MS = 3200

/** The open account lives in the URL so a detail can be linked to from an order. */
const DEVOTEE_PARAM = 'devotee'

const EMPTY_SUMMARY = { total: 0, active: 0, suspended: 0 }

/**
 * App > Devotees — the app's sign-ups.
 *
 * The search, the status filter, the sort and the paging are all applied by the
 * server, and the tiles come from its `summary`. None of it is done here: the
 * list is paged, so filtering the loaded rows would report a page's worth of
 * matches as though it were the whole screen — and the search reaches a family
 * member's name and the romanized spelling of a Malayalam one, neither of which
 * the table prints for a client-side match to find.
 */
export function DevoteesScreen() {
  const can = useCan()
  const canSuspend = can(PERMISSIONS.manageDevotees)

  const [searchParams, setSearchParams] = useSearchParams()
  const openId = Number(searchParams.get(DEVOTEE_PARAM)) || null

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<DevoteeStatusFilter>(ALL_STATUSES)
  const [sortKey, setSortKey] = useState<DevoteeSortKey | ''>('')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [confirmKind, setConfirmKind] = useState<DevoteeConfirmKind | null>(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [],
  )

  function showToast(message: string) {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_MS)
  }

  const filters: DevoteeFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status === ALL_STATUSES ? {} : { status }),
      ...(sortKey ? { ordering: `${sortDir === 'desc' ? '-' : ''}${ORDERING_PARAM[sortKey]}` } : {}),
      page,
      pageSize,
    }),
    [debouncedSearch, status, sortKey, sortDir, page, pageSize],
  )

  const devoteesQuery = useDevoteesQuery(filters)
  const detailQuery = useDevoteeQuery(openId)
  const setStatusMutation = useDevoteeStatusMutation()

  const rows = useMemo(() => devoteesQuery.data?.results ?? [], [devoteesQuery.data])
  const summary = devoteesQuery.data?.summary ?? EMPTY_SUMMARY
  const total = devoteesQuery.data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const listFailure = devoteesQuery.isError ? failureMessage(devoteesQuery.error, 'Devotees could not be loaded.') : null
  const detailFailure = detailQuery.isError ? failureMessage(detailQuery.error, 'This account could not be loaded.') : null

  const openDevotee = detailQuery.data ?? null
  /** The clicked row still names the account while its detail is in flight. */
  const openRowName = rows.find((row) => row.id === openId)?.name ?? ''
  const filtersActive = debouncedSearch !== '' || status !== ALL_STATUSES

  function failureMessage(error: unknown, fallback: string): string {
    return toFailure(error)?.message ?? fallback
  }

  function resetPaging() {
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    resetPaging()
  }

  function handleStatusChange(value: DevoteeStatusFilter) {
    setStatus(value)
    resetPaging()
  }

  function handleClearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setStatus(ALL_STATUSES)
    resetPaging()
  }

  function handleSort(key: DevoteeSortKey) {
    setSortDir((dir) => (sortKey === key && dir === 'asc' ? 'desc' : 'asc'))
    setSortKey(key)
    resetPaging()
  }

  function handleOpenDetail(row: Devotee) {
    setSearchParams((params) => {
      params.set(DEVOTEE_PARAM, String(row.id))
      return params
    })
  }

  function handleCloseDetail() {
    setConfirmKind(null)
    setSearchParams((params) => {
      params.delete(DEVOTEE_PARAM)
      return params
    })
  }

  async function runStatusChange(kind: DevoteeConfirmKind) {
    if (openId === null) return
    const name = openDevotee?.name ?? 'Account'
    try {
      await setStatusMutation.mutateAsync({ id: openId, status: kind === 'suspend' ? 'suspended' : 'active' })
      setConfirmKind(null)
      showToast(kind === 'suspend' ? `${name} suspended` : `${name} reinstated`)
    } catch (error) {
      setConfirmKind(null)
      showToast(failureMessage(error, 'The account status could not be changed.'))
    }
  }

  // Escape closes the top-most layer: the confirm dialog, then the overlay.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (confirmKind) {
        setConfirmKind(null)
        return
      }
      if (openId !== null) handleCloseDetail()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmKind, openId])

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-start gap-4 px-7 pt-6 pb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-heading tracking-title leading-tight text-ink-strong">Devotees</h1>
            <p className="mt-1.5 text-sm text-ink-muted">App user accounts. Accounts are created by devotees in the app.</p>
          </div>
        </div>

        <DevoteesFilterBar
          search={search}
          onSearchChange={handleSearchChange}
          status={status}
          onStatusChange={handleStatusChange}
          resultLabel={`${total.toLocaleString('en-IN')} ${total === 1 ? 'devotee' : 'devotees'}`}
        />

        <DevoteesKpiBand total={summary.total} active={summary.active} suspended={summary.suspended} />

        {listFailure && (
          <div className="mx-7 mb-3">
            <Alert type="danger" icon={<Icon name="warning" size={16} />}>
              {listFailure}
            </Alert>
          </div>
        )}

        <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
          {devoteesQuery.isPending ? (
            <div className="flex min-h-60 flex-1 items-center justify-center">
              <Spinner size={40} />
            </div>
          ) : (
            // Dimmed, not replaced, while the next page loads — the operator
            // keeps their place instead of watching the table blank on every
            // keystroke.
            <div className={`min-h-0 flex-1 overflow-auto transition-opacity ${devoteesQuery.isFetching ? 'opacity-60' : ''}`}>
              <DevoteesTable
                rows={rows}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onRowClick={handleOpenDetail}
                empty={<DevoteesEmptyState filtered={filtersActive} onClearFilters={handleClearFilters} />}
              />
            </div>
          )}
        </div>

        <DevoteesPagination
          total={total}
          page={page - 1}
          pageCount={pageCount}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size)
            resetPaging()
          }}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
        />
      </div>

      {openId !== null && (
        <DevoteeDetailPanel
          devotee={openDevotee}
          fallbackName={openRowName}
          loading={detailQuery.isPending}
          loadError={detailFailure}
          canSuspend={canSuspend}
          busy={setStatusMutation.isPending}
          onBack={handleCloseDetail}
          onSuspend={() => setConfirmKind('suspend')}
          onReinstate={() => setConfirmKind('reinstate')}
        />
      )}

      <DevoteeConfirmDialog
        kind={confirmKind}
        busy={setStatusMutation.isPending}
        onConfirm={() => confirmKind && runStatusChange(confirmKind)}
        onCancel={() => setConfirmKind(null)}
      />
      <DevoteeToast show={toast.show} message={toast.message} />
    </div>
  )
}
