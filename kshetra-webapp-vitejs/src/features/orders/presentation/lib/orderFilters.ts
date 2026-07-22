import type { OrderChannel, OrderPaymentStatus, OrderRecordStatus } from '@/features/orders/domain/entities/order'
import type { OrderRow } from '@/features/orders/presentation/lib/orderRow'
import { digitsOnly } from '@/features/orders/presentation/lib/format'

export type OrderPayFilter = 'all' | OrderPaymentStatus
export type OrderStatusFilter = 'all' | OrderRecordStatus
export type OrderChannelFilter = 'all' | OrderChannel
export type OrderAgentFilter = 'all' | 'yes' | 'no'
export type OrderDateMode = 'all' | 'single' | 'range'

export interface OrderFilterState {
  readonly search: string
  readonly dateMode: OrderDateMode
  readonly date: string
  readonly from: string
  readonly to: string
  readonly pay: OrderPayFilter
  readonly channel: OrderChannelFilter
  readonly status: OrderStatusFilter
  readonly agent: OrderAgentFilter
}

export const DEFAULT_ORDER_FILTERS: OrderFilterState = {
  search: '',
  dateMode: 'all',
  date: '2026-07-10',
  from: '2026-07-01',
  to: '2026-07-31',
  pay: 'all',
  channel: 'all',
  status: 'all',
  agent: 'all',
}

export function ordersFiltersActive(f: OrderFilterState): boolean {
  return !!(f.search.trim() || f.dateMode !== 'all' || f.pay !== 'all' || f.agent !== 'all' || f.channel !== 'all' || f.status !== 'all')
}

/** Applies every Pooja Orders filter + free-text search, replicating the prototype's `filteredOrders`. */
export function filterOrderRows(rows: readonly OrderRow[], f: OrderFilterState): OrderRow[] {
  const q = f.search.trim().toLowerCase()
  const qDigits = digitsOnly(q)
  return rows.filter((row) => {
    if (f.dateMode === 'single') {
      if (f.date && row.date !== f.date) return false
    } else if (f.dateMode === 'range') {
      if (f.from && row.date < f.from) return false
      if (f.to && row.date > f.to) return false
    }
    if (f.pay !== 'all' && row.paymentStatus !== f.pay) return false
    if (f.channel !== 'all' && row.channel !== f.channel) return false
    if (f.status !== 'all' && row.bookingStatus !== f.status) return false
    if (f.agent === 'yes' && !row.agentCode) return false
    if (f.agent === 'no' && row.agentCode) return false
    if (q) {
      const hay = row.searchHay
      if (!hay.includes(q) && !(qDigits && hay.replace(/[^0-9a-z\s]/g, '').includes(qDigits))) return false
    }
    return true
  })
}

export type OrderSortKey = 'ref' | 'devoteeName' | 'date' | 'poojaCount' | 'total' | 'paymentStatus' | 'bookingStatus'
export type OrderSortDir = 'asc' | 'desc'

/** Default order: most recent first, ref as tie-break — matches the prototype when no column is sorted. */
export function defaultSortOrderRows(rows: readonly OrderRow[]): OrderRow[] {
  return [...rows].sort((a, b) => b.date.localeCompare(a.date) || a.ref.localeCompare(b.ref))
}

export function sortOrderRows(rows: readonly OrderRow[], key: OrderSortKey, dir: OrderSortDir): OrderRow[] {
  const sign = dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const x = a[key]
    const y = b[key]
    if (typeof x === 'number' && typeof y === 'number') return sign * (x - y)
    return sign * String(x).localeCompare(String(y), undefined, { numeric: true })
  })
}
