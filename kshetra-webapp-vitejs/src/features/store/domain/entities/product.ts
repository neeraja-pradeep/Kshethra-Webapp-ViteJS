/**
 * A shop product, as the back office sees it.
 *
 * The data model has two levels: a `Product` carries the name, category and
 * description, and one or more `ProductVariant` rows under it carry what is
 * actually sold — SKU, price, picture, stock. The admin catalogue is **flat**:
 * one row is one sellable line, with the *primary* variant's fields folded in.
 *
 * That is honest because nearly every product has exactly one variant. Where a
 * legacy product has more, `variantCount` says so — see `isMultiVariant`, and
 * surface it rather than presenting one variant as the whole product.
 */

/** The product's own status: are we choosing to sell this? */
export type ProductStatus = 'active' | 'inactive' | 'discontinued'

/**
 * What the Active toggle may write. Taking a line out of the catalogue for good
 * is a different decision from hiding it for now, and should not be one
 * mis-click away — so `discontinued` can be filtered but not toggled.
 */
export type ProductWritableStatus = 'active' | 'inactive'

/**
 * Derived server-side from quantity against the line's own threshold, never
 * stored — so it cannot drift from the stock it describes. Exactly the
 * threshold counts as low: a shelf that has reached the alarm number has
 * tripped it, not almost.
 */
export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface ProductCategoryRef {
  readonly id: number
  readonly name: string
}

export interface ProductImage {
  readonly id: number
  readonly url: string
  readonly sortOrder: number
}

/** One row of the catalogue. */
export interface ProductRow {
  /** The **product's** id — what the toggle, the form and the stock endpoint address. */
  readonly id: number
  readonly name: string
  readonly slug: string
  /** The primary variant's. Null only while a product has no variant at all. */
  readonly sku: string | null
  readonly category: ProductCategoryRef | null
  readonly price: number | null
  readonly imageUrl: string | null
  readonly stockQuantity: number
  readonly stockState: StockState
  /**
   * Where "low" starts for this line — per variant, because a temple sells
   * camphor by the hundred and brass idols by the handful.
   */
  readonly lowStockThreshold: number
  readonly status: ProductStatus
  readonly statusDisplay: string
  readonly variantId: number | null
  /** Above 1 means this flat row shows the primary variant only. */
  readonly variantCount: number
  readonly createdAt: string
  readonly updatedAt: string
}

/** `GET`/`POST`/`PATCH` on a single product: the row plus what only the form draws. */
export interface ProductDetail extends ProductRow {
  readonly description: string
  /** Lead image first — it is the one mirrored onto the storefront. */
  readonly images: readonly ProductImage[]
}

/**
 * The tiles. All three states are **always present, even at zero** — they are
 * fixed tiles, and one that vanished at zero would move the other three. The
 * three always sum to `total`.
 */
export interface ProductsSummary {
  readonly total: number
  readonly byStockState: Record<StockState, number>
}

export const STOCK_STATES: readonly StockState[] = ['in_stock', 'low_stock', 'out_of_stock']
export const PRODUCT_STATUSES: readonly ProductStatus[] = ['active', 'inactive', 'discontinued']

const STOCK_STATE_LABELS: Record<StockState, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
}

const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  discontinued: 'Discontinued',
}

export function stockStateLabel(state: StockState): string {
  return STOCK_STATE_LABELS[state]
}

export function productStatusLabel(status: ProductStatus): string {
  return PRODUCT_STATUS_LABELS[status]
}

/** This flat row is one variant of several — say so rather than imply otherwise. */
export function isMultiVariant(row: ProductRow): boolean {
  return row.variantCount > 1
}

/** The two-position switch only makes sense for the two statuses it can write. */
export function isTogglable(row: ProductRow): row is ProductRow & { status: ProductWritableStatus } {
  return row.status === 'active' || row.status === 'inactive'
}
