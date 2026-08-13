import type { OrderChannel, OrderPaymentStatus } from '@/shared/order-feed/domain/order-feed'
import type { OrderFilters } from '@/shared/order-feed/domain/order-feed.repository'

/** The sentinel a `<Select>` uses for "no filter". */
export const ALL = 'all'

export type StoreOrderDateMode = 'all' | 'single' | 'range'

export interface StoreOrderFilterState {
  readonly search: string
  readonly dateMode: StoreOrderDateMode
  readonly date: string
  readonly from: string
  readonly to: string
  readonly paymentStatus: string
  /** The stored fulfilment status, matched exactly by `?status=`. */
  readonly fulfilmentStatus: string
  readonly paymentMethod: string
  readonly channel: string
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
  const mm = String(month).padStart(2, '0')
  return [`${year}-${mm}-01`, `${year}-${mm}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`]
}

/** Defaults to all dates — the old screen hardcoded a window to match its seed data. */
export function defaultStoreOrderFilters(): StoreOrderFilterState {
  const today = todayISO()
  return {
    search: '',
    dateMode: 'all',
    date: today,
    from: today,
    to: today,
    paymentStatus: ALL,
    fulfilmentStatus: ALL,
    paymentMethod: ALL,
    channel: ALL,
  }
}

export function storeOrderFiltersActive(state: StoreOrderFilterState): boolean {
  return (
    state.search.trim() !== '' ||
    state.dateMode !== 'all' ||
    state.paymentStatus !== ALL ||
    state.fulfilmentStatus !== ALL ||
    state.paymentMethod !== ALL ||
    state.channel !== ALL
  )
}

/**
 * Filter state → the shared feed's query.
 *
 * `source: 'product'` is pinned: this is the shop's list, and the feed would
 * otherwise union pooja orders into it.
 *
 * The channel filter **is** offered, against what the docs say. `order-list.md`
 * §9 claims `channel` is "always `app` for shop orders" and §6 that
 * `channel=counter` returns pooja rows only; both were checked against the
 * running API and both are wrong — a shop walk-in reports `counter` with a
 * populated `counter` block, and filtering on it returns exactly those rows.
 */
export function toStoreOrderFilters(
  state: StoreOrderFilterState,
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
    source: 'product',
    ...(search ? { search } : {}),
    ...dateWindow,
    ...(state.paymentStatus === ALL ? {} : { paymentStatus: state.paymentStatus as OrderPaymentStatus }),
    ...(state.fulfilmentStatus === ALL ? {} : { status: state.fulfilmentStatus }),
    ...(state.paymentMethod === ALL ? {} : { paymentMethod: state.paymentMethod }),
    ...(state.channel === ALL ? {} : { channel: state.channel as OrderChannel }),
    page,
    pageSize,
  }
}
