import { useEffect, useMemo, useRef, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { Alert, Icon, Spinner, Table, type SelectOption } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import {
  useAssignPoojariMutation,
  useCompleteBookingsMutation,
} from '@/features/bookings/application/queries/useBookingMutations'
import {
  useBookingGodsQuery,
  useBookingsQuery,
  usePoojarisQuery,
} from '@/features/bookings/application/queries/useBookingsQuery'
import type { Booking } from '@/features/bookings/domain/entities/booking'
import { isCompletable } from '@/features/bookings/domain/entities/booking'
import type { BookingFilters } from '@/features/bookings/domain/repositories/booking.repository'
import { UNASSIGNED_POOJARI } from '@/features/bookings/domain/repositories/booking.repository'
import { BookingDetailDrawer } from '@/features/bookings/presentation/components/BookingDetailDrawer'
import type { BookingDateMode } from '@/features/bookings/presentation/components/BookingDateFilter'
import { BookingsBulkActionBar } from '@/features/bookings/presentation/components/BookingsBulkActionBar'
import { BookingsEmptyState } from '@/features/bookings/presentation/components/BookingsEmptyState'
import { BookingsFilterBar } from '@/features/bookings/presentation/components/BookingsFilterBar'
import { BookingsKpiBand } from '@/features/bookings/presentation/components/BookingsKpiBand'
import { BookingsPagination } from '@/features/bookings/presentation/components/BookingsPagination'
import { ReassignPoojariModal } from '@/features/bookings/presentation/components/ReassignPoojariModal'
import { BookingToast } from '@/features/bookings/presentation/components/BookingToast'
import { buildBookingColumns, SORT_PARAM, type BookingSortKey } from '@/features/bookings/presentation/lib/bookingTableColumns'
import { formatChipDate, todayISO } from '@/features/bookings/presentation/lib/date'

const ALL = 'all'
const PAGE_SIZES = [20, 50, 100]
const DEFAULT_PAGE_SIZE = 20
/** One request per pause in typing, not per keystroke. */
const SEARCH_DEBOUNCE_MS = 300
const TOAST_MS = 3200

const SPECIAL_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'All types' },
  { value: 'special', label: 'Special poojas' },
  // The server's own value is `regular`; the design called it "Standard".
  { value: 'regular', label: 'Standard poojas' },
]
const CHANNEL_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'All channels' },
  { value: 'counter', label: 'Counter' },
  { value: 'app', label: 'Mobile app' },
]
const STATUS_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

interface ReassignTarget {
  readonly ids: readonly number[]
  readonly contextLabel: string
  readonly currentPoojariId: number | null
}

/**
 * Pooja Bookings — the execution view. One row per person, per pooja date.
 *
 * Every filter, the sort and the paging are applied by the server, and the KPI
 * tiles come from its `summary`, which counts the whole filtered set rather
 * than the loaded page — so the numbers hold still while you page through.
 */
export function BookingsScreen() {
  const can = useCan()
  const canComplete = can(PERMISSIONS.managePoojaOrders)
  const canAssign = can(PERMISSIONS.assignPoojari)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateMode, setDateMode] = useState<BookingDateMode>('all')
  const [singleDate, setSingleDate] = useState(todayISO())
  const [rangeFrom, setRangeFrom] = useState(todayISO())
  const [rangeTo, setRangeTo] = useState(todayISO())
  const [god, setGod] = useState(ALL)
  const [poojaType, setPoojaType] = useState(ALL)
  const [poojari, setPoojari] = useState(ALL)
  const [channel, setChannel] = useState(ALL)
  const [status, setStatus] = useState(ALL)

  const [sortKey, setSortKey] = useState<BookingSortKey | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [detailId, setDetailId] = useState<number | null>(null)
  const [reassignTarget, setReassignTarget] = useState<ReassignTarget | null>(null)
  const [reassignSelectedId, setReassignSelectedId] = useState<number | null>(null)
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

  const filters: BookingFilters = useMemo(() => {
    const dateBounds =
      dateMode === 'all'
        ? {}
        : dateMode === 'single'
          ? { dateFrom: singleDate, dateTo: singleDate }
          : { dateFrom: rangeFrom, dateTo: rangeTo }

    return {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...dateBounds,
      ...(god === ALL ? {} : { god: Number(god) }),
      ...(poojaType === ALL ? {} : { poojaType: poojaType as 'special' | 'regular' }),
      ...(poojari === ALL
        ? {}
        : { poojari: poojari === UNASSIGNED_POOJARI ? UNASSIGNED_POOJARI : Number(poojari) }),
      ...(channel === ALL ? {} : { channel: channel as 'counter' | 'app' }),
      ...(status === ALL ? {} : { status: status as 'pending' | 'completed' | 'cancelled' }),
      ...(sortKey ? { sort: `${sortDir === 'desc' ? '-' : ''}${SORT_PARAM[sortKey]}` } : {}),
      page,
      pageSize,
    }
  }, [debouncedSearch, dateMode, singleDate, rangeFrom, rangeTo, god, poojaType, poojari, channel, status, sortKey, sortDir, page, pageSize])

  const bookingsQuery = useBookingsQuery(filters)
  const poojarisQuery = usePoojarisQuery()
  const godsQuery = useBookingGodsQuery()
  const complete = useCompleteBookingsMutation()
  const assign = useAssignPoojariMutation()

  const rows = useMemo(() => bookingsQuery.data?.results ?? [], [bookingsQuery.data])
  const summary = bookingsQuery.data?.summary ?? { total: 0, pending: 0, completed: 0, cancelled: 0 }
  const total = bookingsQuery.data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const godOptions = useMemo<SelectOption[]>(
    () => [
      { value: ALL, label: 'All gods' },
      ...(godsQuery.data ?? []).map((g) => ({ value: String(g.id), label: g.name })),
    ],
    [godsQuery.data],
  )

  const poojariOptions = useMemo<SelectOption[]>(
    () => [
      { value: ALL, label: 'All poojaris' },
      // The server filters on exactly this — "who has nothing rostered" is the
      // question this screen exists to answer.
      { value: UNASSIGNED_POOJARI, label: 'Unassigned' },
      ...(poojarisQuery.data ?? []).map((p) => ({ value: String(p.id), label: p.name })),
    ],
    [poojarisQuery.data],
  )

  /**
   * Selection is per page. With server paging, a "select all" that reached rows
   * the operator cannot see would act on records they never reviewed, so it
   * covers this page only — and is dropped whenever the page or filters move.
   */
  const selectableRows = useMemo(() => rows.filter(isCompletable), [rows])
  const selectedIds = useMemo(
    () => selectableRows.filter((row) => selected[row.id]).map((row) => row.id),
    [selectableRows, selected],
  )
  const allSelected = selectableRows.length > 0 && selectedIds.length === selectableRows.length
  const someSelected = selectedIds.length > 0 && !allSelected

  function resetPaging() {
    setPage(1)
    setSelected({})
  }

  const filtersActive =
    !!debouncedSearch || god !== ALL || status !== ALL || poojari !== ALL || channel !== ALL || poojaType !== ALL || dateMode !== 'all'

  function handleClearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setGod(ALL)
    setPoojaType(ALL)
    setPoojari(ALL)
    setChannel(ALL)
    setStatus(ALL)
    setDateMode('all')
    resetPaging()
  }

  function handleToggleSelectAll() {
    if (allSelected) {
      setSelected({})
      return
    }
    const next: Record<number, boolean> = {}
    selectableRows.forEach((row) => {
      next[row.id] = true
    })
    setSelected(next)
  }

  function handleToggleSelect(id: number) {
    setSelected((s) => ({ ...s, [id]: !s[id] }))
  }

  function handleSort(key: BookingSortKey) {
    setSortDir((dir) => (sortKey === key && dir === 'asc' ? 'desc' : 'asc'))
    setSortKey(key)
    resetPaging()
  }

  const detailBooking = detailId === null ? null : rows.find((row) => row.id === detailId) ?? null
  const busy = complete.isPending || assign.isPending

  function failureMessage(error: unknown, fallback: string): string {
    return toFailure(error)?.message ?? fallback
  }

  async function runComplete(ids: readonly number[], label: string) {
    if (ids.length === 0) return
    const done = await complete.mutateAsync(ids).catch(() => null)
    if (!done) {
      showToast(failureMessage(complete.error, 'Could not mark those bookings complete.'))
      return
    }
    showToast(`${label} marked as completed`)
    setSelected({})
  }

  function openReassign(ids: readonly number[], contextLabel: string, currentPoojariId: number | null) {
    assign.reset()
    setReassignTarget({ ids, contextLabel, currentPoojariId })
    setReassignSelectedId(currentPoojariId)
  }

  function handleBulkReassign() {
    if (selectedIds.length === 0) return
    const poojariIds = new Set(selectableRows.filter((r) => selected[r.id]).map((r) => r.poojari?.id ?? null))
    openReassign(
      selectedIds,
      selectedIds.length === 1 ? '1 selected booking' : `${selectedIds.length} selected bookings`,
      poojariIds.size === 1 ? ([...poojariIds][0] ?? null) : null,
    )
  }

  async function handleConfirmReassign() {
    if (!reassignTarget || reassignSelectedId === null) return
    const done = await assign
      .mutateAsync({ bookingIds: reassignTarget.ids, poojariId: reassignSelectedId })
      .catch(() => null)
    if (!done) return
    const name = poojarisQuery.data?.find((p) => p.id === reassignSelectedId)?.name ?? 'poojari'
    showToast(`${done.length} ${done.length === 1 ? 'booking' : 'bookings'} assigned to ${name}`)
    setReassignTarget(null)
    setReassignSelectedId(null)
    setSelected({})
  }

  const columns = buildBookingColumns({
    sortKey,
    sortDir,
    onSort: handleSort,
    allSelected,
    someSelected,
    onToggleSelectAll: handleToggleSelectAll,
    isSelected: (id) => !!selected[id],
    onToggleSelect: handleToggleSelect,
    isSelectable: isCompletable,
  })

  const loadFailure = bookingsQuery.isError ? failureMessage(bookingsQuery.error, 'Could not load bookings.') : null
  const showBulkBar = selectedIds.length > 0 && (canComplete || canAssign)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex-shrink-0 px-7 pb-3.5 pt-6">
        <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Pooja Bookings</h1>
        <p className="m-0 mt-1.5 text-sm text-ink-muted">Execution view — one booking per person, per pooja date.</p>
      </div>

      <BookingsFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          resetPaging()
        }}
        dateMode={dateMode}
        onDateModeChange={(m) => {
          setDateMode(m)
          resetPaging()
        }}
        singleDate={singleDate}
        onSingleDateChange={(iso) => {
          setSingleDate(iso)
          resetPaging()
        }}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onRangeChange={(from, to) => {
          setRangeFrom(from)
          setRangeTo(to)
          resetPaging()
        }}
        godOptions={godOptions}
        god={god}
        onGodChange={(v) => {
          setGod(v)
          resetPaging()
        }}
        specialOptions={SPECIAL_OPTIONS}
        special={poojaType}
        onSpecialChange={(v) => {
          setPoojaType(v)
          resetPaging()
        }}
        poojariOptions={poojariOptions}
        poojari={poojari}
        onPoojariChange={(v) => {
          setPoojari(v)
          resetPaging()
        }}
        channelOptions={CHANNEL_OPTIONS}
        channel={channel}
        onChannelChange={(v) => {
          setChannel(v)
          resetPaging()
        }}
        statusOptions={STATUS_OPTIONS}
        status={status}
        onStatusChange={(v) => {
          setStatus(v)
          resetPaging()
        }}
        resultLabel={`${total.toLocaleString('en-IN')} ${total === 1 ? 'booking' : 'bookings'}`}
      />

      <BookingsKpiBand
        total={summary.total}
        pending={summary.pending}
        completed={summary.completed}
        cancelled={summary.cancelled}
      />

      {loadFailure && (
        <div className="mx-7 mb-3">
          <Alert type="danger" icon={<Icon name="warning" size={16} />}>
            {loadFailure}
          </Alert>
        </div>
      )}

      {showBulkBar && (
        <BookingsBulkActionBar
          selectedCount={selectedIds.length}
          canComplete={canComplete}
          canAssign={canAssign}
          busy={busy}
          onReassign={handleBulkReassign}
          onMarkComplete={() =>
            runComplete(selectedIds, selectedIds.length === 1 ? '1 booking' : `${selectedIds.length} bookings`)
          }
          onClear={() => setSelected({})}
        />
      )}

      <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        {bookingsQuery.isPending ? (
          <div className="flex min-h-60 flex-1 items-center justify-center">
            <Spinner size={36} />
          </div>
        ) : rows.length > 0 ? (
          // Dimmed, not replaced, while the next page loads — the operator keeps
          // their place instead of watching the table blank on every keystroke.
          <div className={`min-h-0 flex-1 overflow-auto transition-opacity ${bookingsQuery.isFetching ? 'opacity-60' : ''}`}>
            <Table columns={columns} rows={rows as Booking[]} onRowClick={(row) => setDetailId(row.id)} />
          </div>
        ) : (
          <BookingsEmptyState
            icon={filtersActive ? 'magnifying-glass' : 'calendar-blank'}
            message={loadFailure ? 'Bookings could not be loaded.' : filtersActive ? 'No bookings match your filters.' : 'No bookings yet.'}
            filtersActive={filtersActive}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>

      {total > 0 && (
        <BookingsPagination
          start={(page - 1) * pageSize + 1}
          end={Math.min(total, page * pageSize)}
          total={total}
          page={page - 1}
          pageCount={pageCount}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE)
            resetPaging()
          }}
          onPrev={() => {
            setPage((p) => Math.max(1, p - 1))
            setSelected({})
          }}
          onNext={() => {
            setPage((p) => Math.min(pageCount, p + 1))
            setSelected({})
          }}
        />
      )}

      {detailBooking && (
        <BookingDetailDrawer
          booking={detailBooking}
          canComplete={canComplete}
          canAssign={canAssign}
          busy={busy}
          onClose={() => setDetailId(null)}
          onMarkComplete={() => runComplete([detailBooking.id], detailBooking.pooja.name)}
          onReassign={() =>
            openReassign(
              [detailBooking.id],
              `${detailBooking.pooja.name} · ${detailBooking.poojaDate ? formatChipDate(detailBooking.poojaDate) : 'no date'}`,
              detailBooking.poojari?.id ?? null,
            )
          }
        />
      )}

      <ReassignPoojariModal
        open={!!reassignTarget}
        contextLabel={reassignTarget?.contextLabel ?? ''}
        poojaris={poojarisQuery.data ?? []}
        loading={poojarisQuery.isPending}
        currentPoojariId={reassignTarget?.currentPoojariId ?? null}
        selectedId={reassignSelectedId}
        saving={assign.isPending}
        error={assign.isError ? failureMessage(assign.error, 'Could not assign those bookings.') : null}
        onSelect={setReassignSelectedId}
        onClose={() => {
          setReassignTarget(null)
          setReassignSelectedId(null)
        }}
        onConfirm={handleConfirmReassign}
      />

      <BookingToast show={toast.show} message={toast.message} />
    </div>
  )
}
