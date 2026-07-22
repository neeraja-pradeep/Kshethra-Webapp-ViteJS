import { useMemo, useState } from 'react'

import { Table, type SelectOption } from '@/shared/ui'
import type { Booking } from '@/features/bookings/domain/entities/booking'
import { BOOKINGS, PRIESTS } from '@/features/bookings/presentation/data/bookings.mock'
import { BookingDetailDrawer } from '@/features/bookings/presentation/components/BookingDetailDrawer'
import type { BookingDateMode } from '@/features/bookings/presentation/components/BookingDateFilter'
import { BookingsBulkActionBar } from '@/features/bookings/presentation/components/BookingsBulkActionBar'
import { BookingsEmptyState } from '@/features/bookings/presentation/components/BookingsEmptyState'
import { BookingsFilterBar } from '@/features/bookings/presentation/components/BookingsFilterBar'
import { BookingsKpiBand } from '@/features/bookings/presentation/components/BookingsKpiBand'
import { BookingsPagination } from '@/features/bookings/presentation/components/BookingsPagination'
import { ReassignPoojariModal } from '@/features/bookings/presentation/components/ReassignPoojariModal'
import { buildBookingColumns, type BookingSortKey } from '@/features/bookings/presentation/lib/bookingTableColumns'
import { formatChipDate, todayISO } from '@/features/bookings/presentation/lib/date'

const SPECIAL_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All types' },
  { value: 'special', label: 'Special poojas' },
  { value: 'normal', label: 'Standard poojas' },
]
const CHANNEL_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All channels' },
  { value: 'Counter', label: 'Counter' },
  { value: 'Mobile app', label: 'Mobile app' },
]
const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]
const PAGE_SIZES = [20, 50, 100]

// The seed data spans this range; defaulting the filter to it (rather than the
// prototype's literal "today only") means the list shows every row on first
// load instead of an empty day — see the final report for this deviation.
const SEED_DATES = BOOKINGS.map((b) => b.poojaDate).sort()
const DEFAULT_FROM = SEED_DATES[0] ?? todayISO()
const DEFAULT_TO = SEED_DATES[SEED_DATES.length - 1] ?? todayISO()

interface ReassignTarget {
  readonly ids: readonly string[]
  readonly contextLabel: string
  readonly currentPriest: string | null
}

/** Pooja Bookings — execution view. One row per person, per pooja date. */
export function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS)

  const [search, setSearch] = useState('')
  const [dateMode, setDateMode] = useState<BookingDateMode>('range')
  const [singleDate, setSingleDate] = useState(todayISO())
  const [rangeFrom, setRangeFrom] = useState(DEFAULT_FROM)
  const [rangeTo, setRangeTo] = useState(DEFAULT_TO)
  const [god, setGod] = useState('all')
  const [special, setSpecial] = useState('all')
  const [poojari, setPoojari] = useState('all')
  const [channel, setChannel] = useState('all')
  const [status, setStatus] = useState('all')

  const [sortKey, setSortKey] = useState<BookingSortKey | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [detailId, setDetailId] = useState<string | null>(null)
  const [reassignTarget, setReassignTarget] = useState<ReassignTarget | null>(null)
  const [reassignSelected, setReassignSelected] = useState<string | null>(null)

  const godOptions = useMemo<SelectOption[]>(() => {
    const names = Array.from(new Set(bookings.map((b) => b.godName))).sort((a, b) => a.localeCompare(b))
    return [{ value: 'all', label: 'All gods' }, ...names.map((name) => ({ value: name, label: name }))]
  }, [bookings])

  const poojariOptions = useMemo<SelectOption[]>(() => {
    const names = Array.from(new Set(bookings.map((b) => b.poojari))).sort((a, b) => a.localeCompare(b))
    return [{ value: 'all', label: 'All poojaris' }, ...names.map((name) => ({ value: name, label: name }))]
  }, [bookings])

  function resetPagingAndSelection() {
    setPage(0)
    setSelected({})
  }

  const dateModeActive = dateMode === 'single' ? singleDate !== todayISO() : rangeFrom !== DEFAULT_FROM || rangeTo !== DEFAULT_TO
  const filtersActive = !!search || god !== 'all' || status !== 'all' || poojari !== 'all' || channel !== 'all' || special !== 'all' || dateModeActive

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = bookings.filter((b) => {
      if (dateMode === 'single') {
        if (singleDate && b.poojaDate !== singleDate) return false
      } else {
        if (rangeFrom && b.poojaDate < rangeFrom) return false
        if (rangeTo && b.poojaDate > rangeTo) return false
      }
      if (god !== 'all' && b.godName !== god) return false
      if (channel !== 'all' && b.channel !== channel) return false
      if (status !== 'all' && b.status !== status) return false
      if (poojari !== 'all' && b.poojari !== poojari) return false
      if (special === 'special' && !b.special) return false
      if (special === 'normal' && b.special) return false
      if (q) {
        const haystack = `${b.poojaName} ${b.orderRef} ${b.person} ${b.nakshatra} ${b.poojari} ${b.godName} ${b.counterStaff ?? ''} ${b.devoteeAccountName ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    if (sortKey) {
      const dir = sortDir === 'desc' ? -1 : 1
      rows.sort((a, b) => dir * String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { numeric: true }))
    }
    return rows
  }, [bookings, search, dateMode, singleDate, rangeFrom, rangeTo, god, channel, status, poojari, special, sortKey, sortDir])

  const total = filteredRows.length
  const counts = { Pending: 0, Completed: 0, Cancelled: 0 }
  filteredRows.forEach((r) => {
    counts[r.status] += 1
  })

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const pageIndex = Math.min(page, pageCount - 1)
  const pageRows = filteredRows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
  const start = total ? pageIndex * pageSize + 1 : 0
  const end = Math.min(total, (pageIndex + 1) * pageSize)

  const allSelected = filteredRows.length > 0 && filteredRows.every((r) => selected[r.id])
  const someSelected = !allSelected && filteredRows.some((r) => selected[r.id])
  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([id]) => id)

  function handleClearFilters() {
    setSearch('')
    setGod('all')
    setSpecial('all')
    setPoojari('all')
    setChannel('all')
    setStatus('all')
    setDateMode('range')
    setRangeFrom(DEFAULT_FROM)
    setRangeTo(DEFAULT_TO)
    resetPagingAndSelection()
  }

  function handleToggleSelectAll() {
    if (allSelected) {
      setSelected({})
      return
    }
    const next: Record<string, boolean> = {}
    filteredRows.forEach((r) => {
      next[r.id] = true
    })
    setSelected(next)
  }

  function handleToggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }))
  }

  function handleSort(key: BookingSortKey) {
    setSortDir((dir) => (sortKey === key && dir === 'asc' ? 'desc' : 'asc'))
    setSortKey(key)
    setPage(0)
  }

  function applyReassign(ids: readonly string[], priest: string) {
    setBookings((rows) => rows.map((r) => (ids.includes(r.id) ? { ...r, poojari: priest } : r)))
  }

  function handleBulkReassign() {
    if (selectedIds.length === 0) return
    const firstPriest = bookings.find((b) => b.id === selectedIds[0])?.poojari ?? PRIESTS[0]
    setReassignTarget({
      ids: selectedIds,
      contextLabel: selectedIds.length === 1 ? '1 selected booking' : `${selectedIds.length} selected bookings`,
      currentPriest: selectedIds.every((id) => bookings.find((b) => b.id === id)?.poojari === firstPriest) ? firstPriest : null,
    })
    setReassignSelected(firstPriest)
  }

  function handleBulkComplete() {
    if (selectedIds.length === 0) return
    setBookings((rows) => rows.map((r) => (selectedIds.includes(r.id) && r.status === 'Pending' ? { ...r, status: 'Completed', statusTone: 'success' } : r)))
    setSelected({})
  }

  function handleRowClick(row: Booking) {
    setDetailId(row.id)
  }

  const detailBooking = detailId ? bookings.find((b) => b.id === detailId) ?? null : null

  function handleDetailMarkComplete() {
    if (!detailId) return
    setBookings((rows) => rows.map((r) => (r.id === detailId ? { ...r, status: 'Completed', statusTone: 'success' } : r)))
  }

  function handleDetailReassign() {
    if (!detailId) return
    const b = bookings.find((r) => r.id === detailId)
    if (!b) return
    setReassignTarget({ ids: [detailId], contextLabel: `${b.poojaName} · ${formatChipDate(b.poojaDate)}`, currentPriest: b.poojari })
    setReassignSelected(b.poojari)
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
  })

  const emptyIcon = filtersActive ? 'magnifying-glass' : 'calendar-blank'
  const emptyMessage = filtersActive ? 'No bookings match your filters.' : 'No poojas booked for this day.'

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex-shrink-0 px-7 pb-4 pt-6">
        <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Pooja Bookings</h1>
        <p className="m-0 mt-1.5 text-sm text-ink-muted">Execution view — one booking per person, per pooja date.</p>
      </div>

      <BookingsFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          resetPagingAndSelection()
        }}
        dateMode={dateMode}
        onDateModeChange={(m) => {
          setDateMode(m)
          resetPagingAndSelection()
        }}
        singleDate={singleDate}
        onSingleDateChange={(iso) => {
          setSingleDate(iso)
          resetPagingAndSelection()
        }}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onRangeChange={(from, to) => {
          setRangeFrom(from)
          setRangeTo(to)
          resetPagingAndSelection()
        }}
        godOptions={godOptions}
        god={god}
        onGodChange={(v) => {
          setGod(v)
          resetPagingAndSelection()
        }}
        specialOptions={SPECIAL_OPTIONS}
        special={special}
        onSpecialChange={(v) => {
          setSpecial(v)
          resetPagingAndSelection()
        }}
        poojariOptions={poojariOptions}
        poojari={poojari}
        onPoojariChange={(v) => {
          setPoojari(v)
          resetPagingAndSelection()
        }}
        channelOptions={CHANNEL_OPTIONS}
        channel={channel}
        onChannelChange={(v) => {
          setChannel(v)
          resetPagingAndSelection()
        }}
        statusOptions={STATUS_OPTIONS}
        status={status}
        onStatusChange={(v) => {
          setStatus(v)
          resetPagingAndSelection()
        }}
        resultLabel={`${total.toLocaleString('en-IN')} ${total === 1 ? 'booking' : 'bookings'}`}
      />

      <BookingsKpiBand total={total} pending={counts.Pending} completed={counts.Completed} cancelled={counts.Cancelled} />

      {selectedIds.length > 0 && (
        <BookingsBulkActionBar
          selectedCount={selectedIds.length}
          onReassign={handleBulkReassign}
          onMarkComplete={handleBulkComplete}
          onClear={() => setSelected({})}
        />
      )}

      <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        {total > 0 ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <Table columns={columns} rows={pageRows} onRowClick={handleRowClick} />
          </div>
        ) : (
          <BookingsEmptyState icon={emptyIcon} message={emptyMessage} filtersActive={filtersActive} onClearFilters={handleClearFilters} />
        )}
      </div>

      {total > 0 && (
        <BookingsPagination
          start={start}
          end={end}
          total={total}
          page={pageIndex}
          pageCount={pageCount}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(PAGE_SIZES.includes(size) ? size : 20)
            setPage(0)
          }}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        />
      )}

      {detailBooking && (
        <BookingDetailDrawer
          booking={detailBooking}
          onClose={() => setDetailId(null)}
          onMarkComplete={handleDetailMarkComplete}
          onReassign={handleDetailReassign}
        />
      )}

      <ReassignPoojariModal
        open={!!reassignTarget}
        contextLabel={reassignTarget?.contextLabel ?? ''}
        priests={PRIESTS}
        currentPriest={reassignTarget?.currentPriest ?? null}
        selected={reassignSelected}
        onSelect={setReassignSelected}
        onClose={() => {
          setReassignTarget(null)
          setReassignSelected(null)
        }}
        onConfirm={() => {
          if (reassignTarget && reassignSelected) applyReassign(reassignTarget.ids, reassignSelected)
          setReassignTarget(null)
          setReassignSelected(null)
          setSelected({})
        }}
      />
    </div>
  )
}
