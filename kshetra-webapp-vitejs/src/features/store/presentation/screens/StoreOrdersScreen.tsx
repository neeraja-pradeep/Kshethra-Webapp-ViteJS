import { useRef, useState } from 'react'

import { Button, Icon, Input, Select, Spinner, Table } from '@/shared/ui'

import type { FulfilmentStage, Order, OrderLineItem, PaymentState, WalkInCartLine } from '@/features/store/domain/entities/order'
import { FULFILMENT_STATUSES, PAYMENT_STATUSES } from '@/features/store/domain/entities/order'
import { CATEGORIES } from '@/features/store/presentation/data/categories.mock'
import { ORDERS } from '@/features/store/presentation/data/orders.mock'
import { PRODUCTS } from '@/features/store/presentation/data/products.mock'

import { DateRangeMenu, type DateFilterMode, type DatePreset } from '../components/DateRangeMenu'
import { FilteredEmpty } from '../components/FilteredEmpty'
import { KpiTile } from '../components/KpiTile'
import { ListPagination } from '../components/ListPagination'
import { OrderDetailView } from '../components/OrderDetailView'
import { buildOrderColumns, type OrderRow, type OrderSortKey, type SortDir } from '../components/orderTableColumns'
import { PrintPreviewModal, type PrintKind } from '../components/PrintPreviewModal'
import { ToastMessage } from '../components/ToastMessage'
import { WalkInOrderScreen } from '../components/WalkInOrderScreen'
import { ACTING_USER, findProduct, formatOrderDate, fulfilmentDotClass, nowStamp, orderQuantity, orderTotal, todayISO } from '../lib/storeFormat'

const TEMPLE_NAME = 'Sri Kshetra Devasthanam'

/** Store · Orders — order list with fulfilment/payment filters, detail drill-in, refunds, and walk-in POS. */
export function StoreOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>(ORDERS)
  const [search, setSearch] = useState('')
  const [dateMode, setDateMode] = useState<DateFilterMode>('range')
  const [date, setDate] = useState(todayISO())
  const [from, setFrom] = useState('2026-06-01')
  const [to, setTo] = useState('2026-07-31')
  const [payFilter, setPayFilter] = useState('all')
  const [fulfilFilter, setFulfilFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [sortKey, setSortKey] = useState<OrderSortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [openRef, setOpenRef] = useState<string | null>(null)
  const [walkinOpen, setWalkinOpen] = useState(false)
  const [walkinSeq, setWalkinSeq] = useState(4022)
  const [print, setPrint] = useState<{ kind: PrintKind; order: Order } | null>(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string) => {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), 2400)
  }
  const pulseLoading = () => {
    setLoading(true)
    if (loadingTimer.current) clearTimeout(loadingTimer.current)
    loadingTimer.current = setTimeout(() => setLoading(false), 240)
  }

  // Base filters (date range, payment, channel, search) — feeds both the fulfilment summary and the table.
  const base = orders.filter((o) => {
    if (dateMode === 'single') {
      if (o.date !== date) return false
    } else {
      if (from && o.date < from) return false
      if (to && o.date > to) return false
    }
    if (payFilter !== 'all' && o.paymentStatus !== payFilter) return false
    if (channelFilter === 'online' && !o.customer) return false
    if (channelFilter === 'counter' && o.customer) return false
    const q = search.trim().toLowerCase()
    if (q) {
      const custName = o.customer ? o.customer.name : `walk-in ${o.walkinName ?? ''}`
      const phone = o.customer ? o.customer.phone : (o.walkinPhone ?? '')
      const prodNames = o.items.map((it) => findProduct(PRODUCTS, it.productId)?.name ?? '').join(' ')
      const haystack = `${o.ref} ${custName} ${phone} ${o.receiptRef} ${o.paymentMethod} ${prodNames}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const filtered = base.filter((o) => fulfilFilter === 'all' || o.fulfilmentStatus === fulfilFilter).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.ref < b.ref ? 1 : -1))

  if (sortKey) {
    const dir = sortDir === 'desc' ? -1 : 1
    const value = (o: Order): string | number => {
      if (sortKey === 'customer') return o.customer ? o.customer.name : 'Walk-in'
      if (sortKey === 'qty') return orderQuantity(o)
      if (sortKey === 'total') return orderTotal(o, PRODUCTS)
      if (sortKey === 'pay') return o.paymentStatus
      if (sortKey === 'fulfil') return o.fulfilmentStatus
      if (sortKey === 'date') return o.date
      return o.ref
    }
    filtered.sort((a, b) => {
      const x = value(a)
      const y = value(b)
      if (typeof x === 'number' && typeof y === 'number') return dir * (x - y)
      return dir * String(x).localeCompare(String(y), undefined, { numeric: true })
    })
  }

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pages - 1)
  const pageOrders = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize)

  const rows: OrderRow[] = pageOrders.map((o) => ({
    id: o.ref,
    ref: o.ref,
    isWalkIn: !o.customer,
    customerName: o.customer ? o.customer.name : 'Walk-in',
    contact: o.customer ? o.customer.phone : 'Counter pickup',
    dateLabel: formatOrderDate(o.date),
    quantity: orderQuantity(o),
    total: orderTotal(o, PRODUCTS),
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    fulfilmentStatus: o.fulfilmentStatus,
  }))

  const revenue = filtered.filter((o) => o.paymentStatus === 'Paid' || o.paymentStatus === 'Partially Refunded').reduce((sum, o) => sum + orderTotal(o, PRODUCTS), 0)
  const refunds = filtered.reduce((sum, o) => sum + o.refundLog.reduce((a, r) => a + r.amount, 0), 0)

  const hasFilters = search.trim() !== '' || payFilter !== 'all' || fulfilFilter !== 'all' || channelFilter !== 'all'
  const clearFilters = () => {
    setSearch('')
    setPayFilter('all')
    setFulfilFilter('all')
    setChannelFilter('all')
    setPage(0)
    pulseLoading()
  }
  const handleSort = (key: OrderSortKey) => {
    setSortDir((d) => (sortKey === key && d === 'asc' ? 'desc' : 'asc'))
    setSortKey(key)
    setPage(0)
  }
  const toggleFulfilChip = (status: FulfilmentStage) => {
    setFulfilFilter((cur) => (cur === status ? 'all' : status))
    setPage(0)
    pulseLoading()
  }

  const applyDatePreset = (kind: DatePreset) => {
    const today = todayISO()
    if (kind === 'today') {
      setDateMode('single')
      setDate(today)
      setPage(0)
      pulseLoading()
      return
    }
    const [y, m, d] = today.split('-').map(Number)
    let a = today
    let b = today
    if (kind === 'next7') {
      const e = new Date(y, m - 1, d + 6)
      b = `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, '0')}-${String(e.getDate()).padStart(2, '0')}`
    } else if (kind === 'month') {
      const s = new Date(y, m - 1, 1)
      const e = new Date(y, m, 0)
      a = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`
      b = `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, '0')}-${String(e.getDate()).padStart(2, '0')}`
    }
    setDateMode('range')
    setFrom(a)
    setTo(b)
    setPage(0)
    pulseLoading()
  }

  const columns = buildOrderColumns(sortKey, sortDir, handleSort)
  const openOrder = openRef ? orders.find((o) => o.ref === openRef) ?? null : null

  const handleSetFulfilment = (ref: string, stage: FulfilmentStage) => {
    setOrders((os) => os.map((o) => (o.ref === ref ? { ...o, fulfilmentStatus: stage } : o)))
    showToast(`Fulfilment set to ${stage}`)
  }

  const handleApplyItemEdits = (ref: string, items: OrderLineItem[], reductionAmount: number) => {
    setOrders((os) =>
      os.map((o) => {
        if (o.ref !== ref) return o
        const refundLog = o.refundLog.concat([{ kind: 'Partial refund (items reduced)', amount: reductionAmount, reason: 'Items reduced/removed by store staff', user: ACTING_USER, timestamp: nowStamp() }])
        return { ...o, items, refundLog, paymentStatus: o.paymentStatus === 'Paid' ? 'Partially Refunded' : o.paymentStatus }
      }),
    )
    showToast('Items updated · partial refund recorded')
  }

  const handleFullRefund = (ref: string, reason: string) => {
    setOrders((os) =>
      os.map((o) => {
        if (o.ref !== ref) return o
        const amount = orderTotal(o, PRODUCTS)
        const refundLog = o.refundLog.concat([{ kind: 'Full refund', amount, reason, user: ACTING_USER, timestamp: nowStamp() }])
        return { ...o, paymentStatus: 'Refunded' as PaymentState, fulfilmentStatus: 'Cancelled' as FulfilmentStage, refundLog }
      }),
    )
    showToast(`Order ${ref} cancelled and refunded`)
  }

  const handlePartialRefund = (ref: string, amount: number, reason: string) => {
    setOrders((os) =>
      os.map((o) => {
        if (o.ref !== ref) return o
        const refundLog = o.refundLog.concat([{ kind: 'Partial refund', amount, reason, user: ACTING_USER, timestamp: nowStamp() }])
        return { ...o, paymentStatus: 'Partially Refunded' as PaymentState, refundLog }
      }),
    )
    showToast('Partial refund recorded')
  }

  const handleWalkInConfirm = (cart: WalkInCartLine[], name: string, phone: string, method: string): Order => {
    const ref = `ORD-${walkinSeq}`
    const created: Order = {
      ref,
      id: ref,
      customer: null,
      walkinName: name,
      walkinPhone: phone,
      date: todayISO(),
      items: cart,
      paymentMethod: method,
      paymentStatus: 'Paid',
      fulfilmentStatus: 'Delivered',
      receiptRef: `INV-${walkinSeq}`,
      address: null,
      refundLog: [],
    }
    setOrders((os) => [created, ...os])
    setWalkinSeq((n) => n + 1)
    setPage(0)
    showToast(`Walk-in order ${ref} created`)
    return created
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Orders</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Store orders — fulfilment, packing, and refunds.</p>
        </div>
        <Button theme="primary" iconLeft={<Icon name="plus" size={16} />} onClick={() => setWalkinOpen(true)}>
          New walk-in order
        </Button>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 px-7 pb-3">
        <div className="w-[250px] max-w-full">
          <Input
            size="sm"
            placeholder="Search ref, customer, phone, product…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
              pulseLoading()
            }}
            prefix={<Icon name="magnifying-glass" size={15} />}
          />
        </div>
        <DateRangeMenu
          mode={dateMode}
          date={date}
          from={from}
          to={to}
          onModeChange={(mode) => {
            setDateMode(mode)
            setPage(0)
            pulseLoading()
          }}
          onPickSingle={(iso) => {
            setDate(iso)
            setDateMode('single')
            setPage(0)
            pulseLoading()
          }}
          onPickRange={(a, b) => {
            setFrom(a)
            setTo(b)
            setPage(0)
            pulseLoading()
          }}
          onPreset={applyDatePreset}
        />
        <div className="w-[168px]">
          <Select
            size="sm"
            value={payFilter}
            onChange={(e) => {
              setPayFilter(e.target.value)
              setPage(0)
              pulseLoading()
            }}
            options={[{ value: 'all', label: 'All payments' }, ...PAYMENT_STATUSES.map((x) => ({ value: x, label: x }))]}
          />
        </div>
        <div className="w-[180px]">
          <Select
            size="sm"
            value={fulfilFilter}
            onChange={(e) => {
              setFulfilFilter(e.target.value)
              setPage(0)
              pulseLoading()
            }}
            options={[{ value: 'all', label: 'All fulfilment' }, ...FULFILMENT_STATUSES.map((x) => ({ value: x, label: x }))]}
          />
        </div>
        <div className="w-[170px]">
          <Select
            size="sm"
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value)
              setPage(0)
              pulseLoading()
            }}
            options={[
              { value: 'all', label: 'All channels' },
              { value: 'online', label: 'Online (app)' },
              { value: 'counter', label: 'Counter (walk-in)' },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap gap-2.5 px-7 pb-3.5">
        <KpiTile value={String(total)} label={total === 1 ? 'order' : 'orders'} />
        <KpiTile value={`₹${revenue.toLocaleString('en-IN')}`} label="Revenue" />
        <KpiTile value={`₹${refunds.toLocaleString('en-IN')}`} label="Refunds" />
        {FULFILMENT_STATUSES.map((status) => (
          <KpiTile
            key={status}
            value={String(base.filter((o) => o.fulfilmentStatus === status).length)}
            label={status}
            dotClassName={fulfilmentDotClass(status)}
            active={fulfilFilter === status}
            onClick={() => toggleFulfilChip(status)}
          />
        ))}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size={40} />
        </div>
      ) : (
        <>
          <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
            <div className="min-h-0 flex-1 overflow-auto">
              <Table
                columns={columns}
                rows={rows}
                onRowClick={(row) => setOpenRef(row.ref)}
                empty={hasFilters ? <FilteredEmpty message="No orders match your filters." onClear={clearFilters} /> : 'No orders yet.'}
              />
            </div>
          </div>
          <ListPagination
            total={total}
            page={currentPage}
            pageSize={pageSize}
            itemLabel="orders"
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n)
              setPage(0)
            }}
          />
        </>
      )}

      {openOrder && (
        <OrderDetailView
          order={openOrder}
          products={PRODUCTS}
          categories={CATEGORIES}
          onClose={() => setOpenRef(null)}
          onSetFulfilment={handleSetFulfilment}
          onApplyItemEdits={handleApplyItemEdits}
          onFullRefund={handleFullRefund}
          onPartialRefund={handlePartialRefund}
          onPrintReceipt={(order) => setPrint({ kind: 'receipt', order })}
          onPrintAddress={(order) => setPrint({ kind: 'address', order })}
        />
      )}

      {walkinOpen && (
        <WalkInOrderScreen
          products={PRODUCTS}
          categories={CATEGORIES}
          templeName={TEMPLE_NAME}
          onClose={() => setWalkinOpen(false)}
          onConfirm={handleWalkInConfirm}
          onPrintReceipt={(order) => setPrint({ kind: 'receipt', order })}
        />
      )}

      <PrintPreviewModal
        open={!!print}
        kind={print?.kind ?? 'receipt'}
        order={print?.order ?? null}
        products={PRODUCTS}
        categories={CATEGORIES}
        templeName={TEMPLE_NAME}
        onClose={() => setPrint(null)}
      />

      <ToastMessage show={toast.show} message={toast.message} />
    </div>
  )
}
