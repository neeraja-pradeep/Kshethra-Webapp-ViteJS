import type { ProductStatus, StockState } from '@/features/store/domain/entities/product'
import type {
  ProductFilters,
  ProductOrdering,
  ProductOrderingField,
} from '@/features/store/domain/repositories/product.repository'

/** The sentinel a `<Select>` uses for "no filter" — `''` would collide with a real value. */
export const ALL = 'all'

/**
 * The sortable columns.
 *
 * Status is **not** among them: `ordering` accepts only these six, and an
 * unknown value is a `400` rather than being quietly ignored.
 */
export type ProductSortKey = ProductOrderingField
export type SortDir = 'asc' | 'desc'

/** Held as strings because that is what `<Select>` hands back. */
export interface ProductListFilterState {
  readonly search: string
  readonly category: string
  readonly status: string
  readonly stockState: string
  readonly sortKey: ProductSortKey | ''
  readonly sortDir: SortDir
}

export function defaultProductListFilters(): ProductListFilterState {
  return { search: '', category: ALL, status: ALL, stockState: ALL, sortKey: '', sortDir: 'asc' }
}

export function productListFiltersActive(state: ProductListFilterState): boolean {
  return (
    state.search.trim() !== '' ||
    state.category !== ALL ||
    state.status !== ALL ||
    state.stockState !== ALL
  )
}

function toOrdering(key: ProductSortKey | '', dir: SortDir): ProductOrdering | undefined {
  if (!key) return undefined
  return dir === 'desc' ? (`-${key}` as ProductOrdering) : key
}

/** Filter state → the server's query. Nothing here is applied client-side. */
export function toProductFilters(
  state: ProductListFilterState,
  page: number,
  pageSize: number,
  search: string,
): ProductFilters {
  return {
    ...(search ? { search } : {}),
    ...(state.category === ALL ? {} : { category: Number(state.category) }),
    ...(state.status === ALL ? {} : { status: state.status as ProductStatus }),
    ...(state.stockState === ALL ? {} : { stockState: state.stockState as StockState }),
    ...(toOrdering(state.sortKey, state.sortDir) ? { ordering: toOrdering(state.sortKey, state.sortDir) } : {}),
    page,
    pageSize,
  }
}
