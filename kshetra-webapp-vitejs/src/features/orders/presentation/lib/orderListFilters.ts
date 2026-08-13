import type {
  OrderChannel,
  OrderPaymentStatus,
  OrderPoojaStatus,
} from '@/shared/order-feed/domain/order-feed'
import type { OrderFilters } from '@/shared/order-feed/domain/order-feed.repository'

/** The sentinel a Select uses for "no filter" — `''` would collide with a real value. */
export const ALL = 'all'

export type OrderDateMode = 'all' | 'single' | 'range'

/**
 * What the filter bar holds. Kept as strings because that is what `<Select>`
 * hands back; `toOrderFilters` is the single place it becomes a typed query.
 */
export interface OrderListFilterState {
  readonly search: string
  readonly dateMode: OrderDateMode
  readonly date: string
  readonly from: string
  readonly to: string
  readonly paymentStatus: string
  readonly poojaStatus: string
  readonly channel: string
  readonly paymentMethod: string
}

export function todayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function monthBoundsISO(iso: string): readonly [string, string] {
  const [y, m] = iso.split('-').map(Number)
  const year = y ?? 1970
  const month = m ?? 1
  const lastDay = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, '0')
  return [`${year}-${mm}-01`, `${year}-${mm}-${String(lastDay).padStart(2, '0')}`]
}

export function defaultOrderListFilters(): OrderListFilterState {
  const today = todayISO()
  return {
    search: '',
    dateMode: 'all',
    date: today,
    from: today,
    to: today,
    paymentStatus: ALL,
    poojaStatus: ALL,
    channel: ALL,
    paymentMethod: ALL,
  }
}

export function orderListFiltersActive(state: OrderListFilterState): boolean {
  return (
    state.search.trim() !== '' ||
    state.dateMode !== 'all' ||
    state.paymentStatus !== ALL ||
    state.poojaStatus !== ALL ||
    state.channel !== ALL ||
    state.paymentMethod !== ALL
  )
}

/**
 * Filter state → the server's query.
 *
 * `source: 'pooja'` is pinned: this screen is the Pooja Orders screen, and the
 * feed would otherwise union shop orders into it. The date window runs on
 * **`created_at`** — when the order was placed, not when the pooja is performed.
 */
export function toOrderFilters(
  state: OrderListFilterState,
  page: number,
  pageSize: number,
  search: string,
): OrderFilters {
  const dateWindow =
    state.dateMode === 'all'
      ? {}
      : state.dateMode === 'single'
        ? { dateFrom: state.date, dateTo: state.date }
        : { dateFrom: state.from, dateTo: state.to }

  return {
    source: 'pooja',
    ...(search ? { search } : {}),
    ...dateWindow,
    ...(state.paymentStatus === ALL ? {} : { paymentStatus: state.paymentStatus as OrderPaymentStatus }),
    ...(state.poojaStatus === ALL ? {} : { poojaStatus: state.poojaStatus as OrderPoojaStatus }),
    ...(state.channel === ALL ? {} : { channel: state.channel as OrderChannel }),
    ...(state.paymentMethod === ALL ? {} : { paymentMethod: state.paymentMethod }),
    page,
    pageSize,
  }
}
