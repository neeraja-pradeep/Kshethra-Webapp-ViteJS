import { useEffect, useMemo, useRef, useState } from 'react'

import { Spinner, type SelectOption } from '@/shared/ui'
import type { Order, OrderPaymentStatus } from '@/features/orders/domain/entities/order'
import { ORDERS } from '@/features/orders/presentation/data/orders.mock'
import { toOrderRow } from '@/features/orders/presentation/lib/orderRow'
import {
  DEFAULT_ORDER_FILTERS,
  defaultSortOrderRows,
  filterOrderRows,
  ordersFiltersActive,
  sortOrderRows,
  type OrderFilterState,
  type OrderSortDir,
  type OrderSortKey,
} from '@/features/orders/presentation/lib/orderFilters'
import { formatOrderDate, formatRevenue } from '@/features/orders/presentation/lib/format'
import { ORDERS_TODAY_ISO } from '@/features/orders/presentation/lib/today'
import { allOccurrences, orderAllPending } from '@/features/orders/presentation/lib/orderRollup'
import { PRIESTS } from '@/features/orders/presentation/lib/priests'
import type { OccurrenceActionKind } from '@/features/orders/presentation/lib/occurrenceStatus'
import {
  applyPartialRefund,
  cancelOccurrence,
  cancelWholeOrder,
  markOccurrenceComplete,
  markOccurrenceForRefund,
  markOccurrenceRefunded,
  occurrenceAmount,
  reassignOccurrence,
} from '@/features/orders/presentation/lib/orderMutations'
import { formatINR } from '@/shared/lib/format'
import { OrdersFilterBar } from '@/features/orders/presentation/components/OrdersFilterBar'
import { OrdersKpiBand } from '@/features/orders/presentation/components/OrdersKpiBand'
import { OrdersTable } from '@/features/orders/presentation/components/OrdersTable'
import { OrdersPaginationBar } from '@/features/orders/presentation/components/OrdersPaginationBar'
import { OrdersEmptyState } from '@/features/orders/presentation/components/OrdersEmptyState'
import { OrderDetailDrawer } from '@/features/orders/presentation/components/OrderDetailDrawer'
import { OrderConfirmModal, type OrderConfirmKind } from '@/features/orders/presentation/components/OrderConfirmModal'
import { ReassignPoojariModal } from '@/features/orders/presentation/components/ReassignPoojariModal'
import { OrderToast } from '@/features/orders/presentation/components/OrderToast'

const PAGE_SIZES = [20, 50, 100]
const PAGE_SIZE_OPTIONS: SelectOption[] = PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} / page` }))

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1)
  dt.setDate(dt.getDate() + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function monthBounds(iso: string): readonly [string, string] {
  const [y, m] = iso.split('-').map(Number)
  const first = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const last = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return [first, last]
}

interface ReassignState {
  readonly open: boolean
  readonly occurrenceId: string | null
  readonly selected: string | null
}

/** The Pooja Orders screen: list + filters + KPIs, and the order-detail drawer with cancel/refund flows. */
export function OrdersScreen() {
  const [orders, setOrders] = useState<readonly Order[]>(ORDERS)
  const [filters, setFilters] = useState<OrderFilterState>(DEFAULT_ORDER_FILTERS)
  const [sortKey, setSortKey] = useState<OrderSortKey | ''>('')
  const [sortDir, setSortDir] = useState<OrderSortDir>('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [loading, setLoading] = useState(false)
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [openRef, setOpenRef] = useState<string | null>(null)
  const [selectedOccurrenceIds, setSelectedOccurrenceIds] = useState<ReadonlySet<string>>(new Set())
  const [cancelReason, setCancelReason] = useState('')
  const [partialAmount, setPartialAmount] = useState('')
  const [partialReason, setPartialReason] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; kind: OrderConfirmKind | null }>({ open: false, kind: null })
  const [pendingOccurrenceId, setPendingOccurrenceId] = useState<string | null>(null)
  const [reassign, setReassign] = useState<ReassignState>({ open: false, occurrenceId: null, selected: null })
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function showToast(message: string) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  function triggerLoading() {
    setLoading(true)
    window.clearTimeout(loadingTimer.current)
    loadingTimer.current = setTimeout(() => setLoading(false), 450)
  }

  useEffect(
    () => () => {
      window.clearTimeout(loadingTimer.current)
      window.clearTimeout(toastTimer.current)
    },
    [],
  )

  function updateFilters(patch: Partial<OrderFilterState>) {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(0)
    triggerLoading()
  }

  // ---- List pipeline ---------------------------------------------------
  const allRows = useMemo(() => orders.map(toOrderRow), [orders])
  const filteredRows = useMemo(() => filterOrderRows(allRows, filters), [allRows, filters])
  const sortedRows = useMemo(
    () => (sortKey ? sortOrderRows(filteredRows, sortKey, sortDir) : defaultSortOrderRows(filteredRows)),
    [filteredRows, sortKey, sortDir],
  )

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const pageN = Math.min(page, totalPages - 1)
  const pageRows = sortedRows.slice(pageN * pageSize, pageN * pageSize + pageSize)
  const filtersActive = ordersFiltersActive(filters)

  const revenue = sortedRows
    .filter((r) => r.paymentStatus === 'Paid' || r.paymentStatus === 'Partially Refunded')
    .reduce((sum, r) => sum + r.total, 0)
  const refundsCount = sortedRows.filter((r) => r.paymentStatus === 'Refunded' || r.paymentStatus === 'Partially Refunded').length
  const statusCounts: Record<OrderPaymentStatus, number> = { Paid: 0, Pending: 0, Refunded: 0, 'Partially Refunded': 0 }
  sortedRows.forEach((r) => {
    statusCounts[r.paymentStatus] += 1
  })

  const startN = sortedRows.length === 0 ? 0 : pageN * pageSize + 1
  const endN = Math.min(sortedRows.length, (pageN + 1) * pageSize)

  function handleSort(key: OrderSortKey) {
    setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc')
    setSortKey(key)
    setPage(0)
  }

  // ---- Order detail ------------------------------------------------------
  const openOrder = openRef ? (orders.find((o) => o.ref === openRef) ?? null) : null

  const selectedIds = useMemo(() => {
    if (!openOrder) return new Set<string>()
    const valid = new Set<string>()
    allOccurrences(openOrder).forEach((occ) => {
      if (selectedOccurrenceIds.has(occ.id) && occ.recordStatus !== 'Cancelled') valid.add(occ.id)
    })
    return valid
  }, [openOrder, selectedOccurrenceIds])

  const selectedAmount = openOrder ? Array.from(selectedIds).reduce((sum, id) => sum + occurrenceAmount(openOrder, id), 0) : 0
  const allPending = openOrder ? orderAllPending(openOrder) : false
  const cancelDisabled = !allPending || !cancelReason.trim()
  const partialDisabled = !(selectedIds.size > 0 && Number(partialAmount) > 0 && partialReason.trim())

  function openOrderDetail(ref: string) {
    setOpenRef(ref)
    setSelectedOccurrenceIds(new Set())
    setCancelReason('')
    setPartialAmount('')
    setPartialReason('')
  }

  function closeOrderDetail() {
    setOpenRef(null)
  }

  function mutateOpenOrder(fn: (order: Order) => Order) {
    setOrders((prev) => prev.map((o) => (o.ref === openRef ? fn(o) : o)))
  }

  function toggleOccurrenceSelect(occurrenceId: string) {
    if (!openOrder) return
    setSelectedOccurrenceIds((prev) => {
      const next = new Set(prev)
      if (next.has(occurrenceId)) next.delete(occurrenceId)
      else next.add(occurrenceId)
      const sum = Array.from(next).reduce((sum2, id) => sum2 + occurrenceAmount(openOrder, id), 0)
      setPartialAmount(sum ? String(sum) : '')
      return next
    })
  }

  function handleOccurrenceAction(occurrenceId: string, kind: OccurrenceActionKind) {
    if (kind === 'complete') {
      mutateOpenOrder((o) => markOccurrenceComplete(o, occurrenceId))
      showToast('Pooja marked complete')
    } else if (kind === 'reassign' || kind === 'reassign-again') {
      setReassign({ open: true, occurrenceId, selected: null })
    } else if (kind === 'cancel') {
      setPendingOccurrenceId(occurrenceId)
      setConfirm({ open: true, kind: 'cancel-occurrence' })
    } else if (kind === 'refund') {
      mutateOpenOrder((o) => markOccurrenceForRefund(o, occurrenceId))
      showToast('Marked for refund')
    } else if (kind === 'refunded') {
      mutateOpenOrder((o) => markOccurrenceRefunded(o, occurrenceId))
      showToast('Marked as refunded')
    }
  }

  function handleConfirmYes() {
    if (confirm.kind === 'cancel-order' && openOrder) {
      const ref = openOrder.ref
      mutateOpenOrder((o) => cancelWholeOrder(o, cancelReason.trim()))
      setCancelReason('')
      showToast(`Order ${ref} cancelled and refunded`)
    } else if (confirm.kind === 'partial-refund' && openOrder) {
      const amount = Number(partialAmount) || 0
      mutateOpenOrder((o) => applyPartialRefund(o, selectedIds, amount, partialReason.trim()))
      setSelectedOccurrenceIds(new Set())
      setPartialAmount('')
      setPartialReason('')
      showToast('Partial refund recorded')
    } else if (confirm.kind === 'cancel-occurrence' && pendingOccurrenceId) {
      mutateOpenOrder((o) => cancelOccurrence(o, pendingOccurrenceId))
      showToast('Pooja cancelled')
    }
    setConfirm({ open: false, kind: null })
    setPendingOccurrenceId(null)
  }

  function closeReassign() {
    setReassign({ open: false, occurrenceId: null, selected: null })
  }

  function confirmReassign() {
    const { occurrenceId, selected } = reassign
    if (occurrenceId && selected) {
      mutateOpenOrder((o) => reassignOccurrence(o, occurrenceId, selected))
      showToast('Poojari reassigned')
    }
    closeReassign()
  }

  const reassignOccurrenceRef = openOrder && reassign.occurrenceId ? findOccurrence(openOrder, reassign.occurrenceId) : null

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex-shrink-0 px-7 pb-4 pt-6">
        <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Pooja Orders</h1>
        <p className="m-0 mt-1.5 text-sm text-ink-muted">One row per order — payments, receipts, and refunds.</p>
      </div>

      <OrdersFilterBar
        search={filters.search}
        onSearchChange={(value) => updateFilters({ search: value })}
        dateMode={filters.dateMode}
        date={filters.date}
        from={filters.from}
        to={filters.to}
        onDateModeChange={(mode) => updateFilters({ dateMode: mode })}
        onDateChange={(iso) => updateFilters({ date: iso })}
        onFromChange={(iso) => updateFilters({ from: iso })}
        onToChange={(iso) => updateFilters({ to: iso })}
        onAllDates={() => updateFilters({ dateMode: 'all' })}
        onToday={() => updateFilters({ dateMode: 'single', date: ORDERS_TODAY_ISO })}
        onNext7Days={() => updateFilters({ dateMode: 'range', from: ORDERS_TODAY_ISO, to: addDaysISO(ORDERS_TODAY_ISO, 6) })}
        onThisMonth={() => {
          const [first, last] = monthBounds(ORDERS_TODAY_ISO)
          updateFilters({ dateMode: 'range', from: first, to: last })
        }}
        pay={filters.pay}
        onPayChange={(value) => updateFilters({ pay: value })}
        status={filters.status}
        onStatusChange={(value) => updateFilters({ status: value })}
        channel={filters.channel}
        onChannelChange={(value) => updateFilters({ channel: value })}
        agent={filters.agent}
        onAgentChange={(value) => updateFilters({ agent: value })}
        resultLabel={`${sortedRows.length.toLocaleString('en-IN')} ${sortedRows.length === 1 ? 'order' : 'orders'}`}
      />

      <OrdersKpiBand ordersCount={sortedRows.length} revenueLabel={formatRevenue(revenue)} refundsCount={refundsCount} statusCounts={statusCounts} />

      <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        {loading ? (
          <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-3 text-ink-subtle">
            <Spinner size={28} />
            <span className="text-sm">Loading orders…</span>
          </div>
        ) : sortedRows.length > 0 ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <OrdersTable rows={pageRows} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} onOpenOrder={openOrderDetail} empty="No pooja orders yet." />
          </div>
        ) : (
          <OrdersEmptyState filtered={filtersActive} onClearFilters={() => updateFilters(DEFAULT_ORDER_FILTERS)} />
        )}
      </div>

      {!loading && sortedRows.length > 0 && (
        <OrdersPaginationBar
          pageInfo={`Showing ${startN}–${endN} of ${sortedRows.length.toLocaleString('en-IN')} orders`}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(0)
          }}
          pageLabel={`Page ${pageN + 1} of ${totalPages}`}
          prevDisabled={pageN === 0}
          nextDisabled={pageN >= totalPages - 1}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        />
      )}

      {openOrder && (
        <OrderDetailDrawer
          order={openOrder}
          crumbLabel="Pooja Orders"
          todayIso={ORDERS_TODAY_ISO}
          onClose={closeOrderDetail}
          selectedOccurrenceIds={selectedIds}
          onToggleSelect={toggleOccurrenceSelect}
          onOccurrenceAction={handleOccurrenceAction}
          cancelBlocked={!allPending}
          cancelReason={cancelReason}
          onCancelReasonChange={setCancelReason}
          cancelDisabled={cancelDisabled}
          onAskCancelOrder={() => setConfirm({ open: true, kind: 'cancel-order' })}
          hasSelection={selectedIds.size > 0}
          selectedCount={selectedIds.size}
          selectedAmountLabel={formatINR(selectedAmount)}
          partialAmount={partialAmount}
          onPartialAmountChange={(v) => setPartialAmount(v.replace(/[^0-9]/g, ''))}
          partialReason={partialReason}
          onPartialReasonChange={setPartialReason}
          partialDisabled={partialDisabled}
          onAskPartialRefund={() => setConfirm({ open: true, kind: 'partial-refund' })}
          onViewReceipt={() => showToast(`Receipt ${openOrder.receiptRef} — view is a later pass.`)}
        />
      )}

      <OrderConfirmModal open={confirm.open} kind={confirm.kind} onCancel={() => setConfirm({ open: false, kind: null })} onConfirm={handleConfirmYes} />

      <ReassignPoojariModal
        open={reassign.open}
        poojaLabel={reassignOccurrenceRef ? `${reassignOccurrenceRef.poojaName} · ${reassignOccurrenceRef.dateLabel}` : ''}
        priests={PRIESTS}
        currentPriest={reassignOccurrenceRef?.currentPriest ?? ''}
        selected={reassign.selected}
        onSelect={(name) => setReassign((r) => ({ ...r, selected: name }))}
        onClose={closeReassign}
        onConfirm={confirmReassign}
      />

      <OrderToast message={toast} />
    </div>
  )
}

interface FoundOccurrence {
  readonly poojaName: string
  readonly dateLabel: string
  readonly currentPriest: string
}

function findOccurrence(order: Order, occurrenceId: string): FoundOccurrence | null {
  for (const item of order.lineItems) {
    const occ = item.occurrences.find((o) => o.id === occurrenceId)
    if (occ) {
      return { poojaName: item.poojaName, dateLabel: formatOrderDate(occ.date), currentPriest: occ.reassignment?.priest ?? occ.poojari }
    }
  }
  return null
}
