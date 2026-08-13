import { useEffect, useMemo, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { Alert, Spinner, type SelectOption } from '@/shared/ui'
import { formatCount } from '@/shared/lib/format'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import { useOrdersQuery } from '@/features/orders/application/queries/useOrdersQuery'
import { OrderDetailPanel } from '@/features/orders/presentation/components/OrderDetailPanel'
import { OrdersEmptyState } from '@/features/orders/presentation/components/OrdersEmptyState'
import { OrdersListFilterBar } from '@/features/orders/presentation/components/OrdersListFilterBar'
import { OrdersListTable } from '@/features/orders/presentation/components/OrdersListTable'
import { OrdersPaginationBar } from '@/features/orders/presentation/components/OrdersPaginationBar'
import { OrderFeedSummaryBand } from '@/shared/order-feed/presentation/OrderFeedSummaryBand'
import {
  ALL,
  addDaysISO,
  defaultOrderListFilters,
  monthBoundsISO,
  orderListFiltersActive,
  todayISO,
  toOrderFilters,
  type OrderListFilterState,
} from '@/features/orders/presentation/lib/orderListFilters'

const PAGE_SIZES = [20, 50, 100]
const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS: SelectOption[] = PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} / page` }))
/** One request per pause in typing, not per keystroke. */
const SEARCH_DEBOUNCE_MS = 300

const EMPTY_SUMMARY = {
  total: 0,
  amount: 0,
  refunds: { count: 0, amount: 0 },
  byPaymentStatus: {},
} as const

/**
 * Pooja Orders — the money view. One row per order, one checkout.
 *
 * Every filter and the paging are applied by the server, and the tiles come
 * from its `summary`, which counts the whole filtered set rather than the
 * loaded page — so the numbers hold still while you page through, and revenue
 * is the net figure the server computed rather than a column summed on screen.
 */
export function OrdersScreen() {
  const can = useCan()
  const canView = can(PERMISSIONS.managePoojaOrders)

  const [filters, setFilters] = useState<OrderListFilterState>(defaultOrderListFilters)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [openOrderId, setOpenOrderId] = useState<number | null>(null)

  const today = todayISO()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [filters.search])

  const query = useMemo(
    () => toOrderFilters(filters, page, pageSize, debouncedSearch),
    [filters, page, pageSize, debouncedSearch],
  )

  const ordersQuery = useOrdersQuery(query)

  const rows = ordersQuery.data?.results ?? []
  const count = ordersQuery.data?.count ?? 0
  const summary = ordersQuery.data?.summary ?? EMPTY_SUMMARY
  const failure = toFailure(ordersQuery.error)

  // A page still being fetched behind the one on screen — `keepPreviousData`
  // holds the old rows, and they are dimmed rather than blanked.
  const stale = ordersQuery.isPlaceholderData || ordersQuery.isFetching

  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const startN = count === 0 ? 0 : (page - 1) * pageSize + 1
  const endN = Math.min(count, page * pageSize)
  const filtersActive = orderListFiltersActive(filters)

  /** Any filter change resets to page 1 — page 7 of the old result set is meaningless. */
  function updateFilters(patch: Partial<OrderListFilterState>) {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
  }

  function clearFilters() {
    setFilters(defaultOrderListFilters())
    setPage(1)
  }

  /** A status tile toggles its own filter — clicking the active one clears it. */
  function togglePaymentStatus(status: string) {
    updateFilters({ paymentStatus: filters.paymentStatus === status ? ALL : status })
  }

  if (!canView) {
    return (
      <div className="flex h-full flex-col bg-sunken px-7 py-6">
        <Alert type="danger" title="No access">
          You do not have permission to view pooja orders.
        </Alert>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex-shrink-0 px-7 pb-4 pt-6">
        <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Pooja Orders</h1>
        <p className="m-0 mt-1.5 text-sm text-ink-muted">One row per order — payments, receipts, and refunds.</p>
      </div>

      <OrdersListFilterBar
        search={filters.search}
        onSearchChange={(value) => updateFilters({ search: value })}
        dateMode={filters.dateMode}
        date={filters.date}
        from={filters.from}
        to={filters.to}
        todayIso={today}
        onDateModeChange={(mode) => updateFilters({ dateMode: mode })}
        onDateChange={(iso) => updateFilters({ dateMode: 'single', date: iso })}
        onFromChange={(iso) => updateFilters({ from: iso })}
        onToChange={(iso) => updateFilters({ to: iso })}
        onAllDates={() => updateFilters({ dateMode: 'all' })}
        onToday={() => updateFilters({ dateMode: 'single', date: today })}
        // Orders are placed in the past, so the quick range looks backwards —
        // unlike the bookings screen, whose work is all ahead of it.
        onLast7Days={() => updateFilters({ dateMode: 'range', from: addDaysISO(today, -6), to: today })}
        onThisMonth={() => {
          const [first, last] = monthBoundsISO(today)
          updateFilters({ dateMode: 'range', from: first, to: last })
        }}
        paymentStatus={filters.paymentStatus}
        onPaymentStatusChange={(value) => updateFilters({ paymentStatus: value })}
        poojaStatus={filters.poojaStatus}
        onPoojaStatusChange={(value) => updateFilters({ poojaStatus: value })}
        channel={filters.channel}
        onChannelChange={(value) => updateFilters({ channel: value })}
        paymentMethod={filters.paymentMethod}
        onPaymentMethodChange={(value) => updateFilters({ paymentMethod: value })}
        resultLabel={`${formatCount(count)} ${count === 1 ? 'order' : 'orders'}`}
      />

      <OrderFeedSummaryBand
        summary={summary}
        stale={stale}
        activePaymentStatus={filters.paymentStatus}
        onPaymentStatusClick={togglePaymentStatus}
      />

      {failure && (
        <div className="px-7 pb-3">
          <Alert type="danger" title="Could not load orders">
            {failure.message}
          </Alert>
        </div>
      )}

      <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        {ordersQuery.isPending ? (
          <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-3 text-ink-subtle">
            <Spinner size={28} />
            <span className="text-sm">Loading orders…</span>
          </div>
        ) : rows.length > 0 ? (
          <div className={`min-h-0 flex-1 overflow-auto ${stale ? 'opacity-60' : ''}`} aria-busy={stale}>
            <OrdersListTable rows={rows} onOpenOrder={setOpenOrderId} empty="No pooja orders yet." />
          </div>
        ) : (
          <OrdersEmptyState filtered={filtersActive} onClearFilters={clearFilters} />
        )}
      </div>

      {!ordersQuery.isPending && count > 0 && (
        <OrdersPaginationBar
          pageInfo={`Showing ${startN}–${endN} of ${formatCount(count)} orders`}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
          pageLabel={`Page ${page} of ${totalPages}`}
          prevDisabled={page <= 1}
          nextDisabled={page >= totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}

      {openOrderId != null && (
        <OrderDetailPanel orderId={openOrderId} crumbLabel="Pooja Orders" onClose={() => setOpenOrderId(null)} />
      )}
    </div>
  )
}
