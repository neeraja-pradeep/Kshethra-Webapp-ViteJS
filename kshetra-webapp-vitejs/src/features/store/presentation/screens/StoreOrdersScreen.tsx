import { useEffect, useMemo, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { formatCount } from '@/shared/lib/format'
import { Alert, Button, Icon, Input, Select, Spinner } from '@/shared/ui'
import { ORDER_PAYMENT_STATUSES, orderPaymentStatusLabel } from '@/shared/order-feed/domain/order-feed'
import { useOrderFeedQuery } from '@/shared/order-feed/application/useOrderFeedQuery'
import { OrderFeedSummaryBand } from '@/shared/order-feed/presentation/OrderFeedSummaryBand'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCanAll } from '@/features/auth/application/hooks/useCan'
import { useCan } from '@/features/auth/application/hooks/useCan'
import { useStoreOrderReceiptQuery } from '@/features/store/application/queries/useStoreOrderQueries'
import { FULFILMENT_FLOW, fulfilmentLabel } from '@/features/store/domain/entities/store-order'
import {
  ALL,
  addDaysISO,
  defaultStoreOrderFilters,
  monthBoundsISO,
  storeOrderFiltersActive,
  todayISO,
  toStoreOrderFilters,
  type StoreOrderFilterState,
} from '@/features/store/presentation/lib/storeOrderListFilters'

import { DateRangeMenu } from '../components/DateRangeMenu'
import { FilteredEmpty } from '../components/FilteredEmpty'
import { ListPagination } from '../components/ListPagination'
import { StoreOrderDetailPanel } from '../components/StoreOrderDetailPanel'
import { StoreOrdersTable } from '../components/StoreOrdersTable'
import { StoreReceiptModal } from '../components/StoreReceiptModal'
import { WalkInOrderScreen } from '../components/WalkInOrderScreen'

const DEFAULT_PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const EMPTY_SUMMARY = {
  total: 0,
  amount: 0,
  refunds: { count: 0, amount: 0 },
  byPaymentStatus: {},
} as const

const CHANNEL_OPTIONS = [
  { value: ALL, label: 'All channels' },
  { value: 'app', label: 'Online (app)' },
  { value: 'counter', label: 'Counter (walk-in)' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: ALL, label: 'All methods' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'cod', label: 'Cash on delivery' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Netbanking' },
]

/**
 * Store · Orders — the shop half of the back office order feed.
 *
 * Reads the same endpoint as Pooja Orders with `?source=product`, through the
 * shared feed module, and renders the shop's own columns: fulfilment rather
 * than pooja status, items rather than poojas.
 */
export function StoreOrdersScreen() {
  const can = useCan()
  const canView = can(PERMISSIONS.viewEcommerceOrder)
  // Taking a sale writes an order, its lines and the stock coming off the shelf.
  const canSell = useCanAll([
    PERMISSIONS.addEcommerceOrder,
    PERMISSIONS.addEcommerceOrderLine,
    PERMISSIONS.changeStock,
  ])

  const [filters, setFilters] = useState<StoreOrderFilterState>(defaultStoreOrderFilters)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [openOrderId, setOpenOrderId] = useState<number | null>(null)
  const [walkInOpen, setWalkInOpen] = useState(false)
  /** The order just sold, so its receipt can be shown straight away. */
  const [soldReceiptId, setSoldReceiptId] = useState<number | null>(null)

  const today = todayISO()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [filters.search])

  const query = useMemo(
    () => toStoreOrderFilters(filters, page, pageSize, debouncedSearch),
    [filters, page, pageSize, debouncedSearch],
  )

  const ordersQuery = useOrderFeedQuery(query)
  const soldReceipt = useStoreOrderReceiptQuery(soldReceiptId)
  const rows = ordersQuery.data?.results ?? []
  const count = ordersQuery.data?.count ?? 0
  const summary = ordersQuery.data?.summary ?? EMPTY_SUMMARY
  const failure = toFailure(ordersQuery.error)
  const stale = ordersQuery.isPlaceholderData || ordersQuery.isFetching
  const filtersActive = storeOrderFiltersActive(filters)

  function updateFilters(patch: Partial<StoreOrderFilterState>) {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
  }

  const paymentStatusOptions = [
    { value: ALL, label: 'All payments' },
    ...ORDER_PAYMENT_STATUSES.map((s) => ({ value: s, label: orderPaymentStatusLabel(s) })),
  ]
  const fulfilmentOptions = [
    { value: ALL, label: 'All fulfilment' },
    ...FULFILMENT_FLOW.map((s) => ({ value: s, label: fulfilmentLabel(s) })),
    { value: 'cancelled', label: fulfilmentLabel('cancelled') },
  ]

  if (!canView) {
    return (
      <div className="flex h-full flex-col bg-sunken px-7 py-6">
        <Alert type="danger" title="No access">
          You do not have permission to view store orders.
        </Alert>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-4 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Store Orders</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Fulfilment, payments and refunds.</p>
        </div>
        {canSell && (
          <Button
            theme="primary"
            iconLeft={<Icon name="storefront" size={16} />}
            onClick={() => setWalkInOpen(true)}
          >
            New walk-in order
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 px-7 pb-3">
        <div className="w-[280px] max-w-full">
          <Input
            size="sm"
            placeholder="Search SO-4021, customer, phone, product…"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            prefix={<Icon name="magnifying-glass" size={15} />}
          />
        </div>

        <DateRangeMenu
          mode={filters.dateMode}
          date={filters.date}
          from={filters.from}
          to={filters.to}
          onModeChange={(mode) => updateFilters({ dateMode: mode })}
          onPickSingle={(iso: string) => updateFilters({ dateMode: 'single', date: iso })}
          onPickRange={(from: string, to: string) => updateFilters({ dateMode: 'range', from, to })}
          onPreset={(kind) => {
            if (kind === 'all') return updateFilters({ dateMode: 'all' })
            if (kind === 'today') return updateFilters({ dateMode: 'single', date: today })
            // Orders were placed in the past, so the quick range looks backwards —
            // unlike the bookings screen, whose work is all ahead of it.
            if (kind === 'last7') {
              return updateFilters({ dateMode: 'range', from: addDaysISO(today, -6), to: today })
            }
            const [first, last] = monthBoundsISO(today)
            return updateFilters({ dateMode: 'range', from: first, to: last })
          }}
        />

        <div className="w-[180px] max-w-full">
          <Select
            size="sm"
            options={paymentStatusOptions}
            value={filters.paymentStatus}
            onChange={(e) => updateFilters({ paymentStatus: e.target.value })}
          />
        </div>
        <div className="w-[170px] max-w-full">
          <Select
            size="sm"
            options={fulfilmentOptions}
            value={filters.fulfilmentStatus}
            onChange={(e) => updateFilters({ fulfilmentStatus: e.target.value })}
          />
        </div>
        <div className="w-[170px] max-w-full">
          <Select
            size="sm"
            options={CHANNEL_OPTIONS}
            value={filters.channel}
            onChange={(e) => updateFilters({ channel: e.target.value })}
          />
        </div>
        <div className="w-[160px] max-w-full">
          <Select
            size="sm"
            options={PAYMENT_METHOD_OPTIONS}
            value={filters.paymentMethod}
            onChange={(e) => updateFilters({ paymentMethod: e.target.value })}
          />
        </div>

        <div className="flex-1" />
        <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">
          {formatCount(count)} {count === 1 ? 'order' : 'orders'}
        </span>
      </div>

      <OrderFeedSummaryBand
        summary={summary}
        stale={stale}
        activePaymentStatus={filters.paymentStatus}
        onPaymentStatusClick={(status) =>
          updateFilters({ paymentStatus: filters.paymentStatus === status ? ALL : status })
        }
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
            <StoreOrdersTable rows={rows} onOpenOrder={setOpenOrderId} empty="No store orders yet." />
          </div>
        ) : (
          <div className="flex min-h-60 flex-1 items-center justify-center p-10 text-center text-sm text-ink-muted">
            {filtersActive ? (
              <FilteredEmpty
                message="No orders match your filters."
                onClear={() => {
                  setFilters(defaultStoreOrderFilters())
                  setPage(1)
                }}
              />
            ) : (
              'No store orders yet.'
            )}
          </div>
        )}
      </div>

      {!ordersQuery.isPending && count > 0 && (
        <ListPagination
          total={count}
          page={page - 1}
          pageSize={pageSize}
          itemLabel="orders"
          onPageChange={(next) => setPage(next + 1)}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}

      {openOrderId != null && (
        <StoreOrderDetailPanel orderId={openOrderId} onClose={() => setOpenOrderId(null)} />
      )}

      {walkInOpen && (
        <WalkInOrderScreen
          onClose={() => setWalkInOpen(false)}
          onSold={(order) => {
            setWalkInOpen(false)
            setSoldReceiptId(order.id)
          }}
        />
      )}

      <StoreReceiptModal
        open={soldReceiptId != null}
        receipt={soldReceipt.data}
        loading={soldReceipt.isPending}
        errorMessage={toFailure(soldReceipt.error)?.message ?? null}
        onClose={() => setSoldReceiptId(null)}
      />
    </div>
  )
}
