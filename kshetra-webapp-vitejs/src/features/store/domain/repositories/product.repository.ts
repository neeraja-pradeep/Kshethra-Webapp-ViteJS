import type { Result } from '@/core/error/result'
import type {
  StockAdjustmentEntry,
  StockAdjustmentInput,
} from '@/features/store/domain/entities/stock-adjustment'
import type {
  ProductDetail,
  ProductRow,
  ProductStatus,
  ProductWritableStatus,
  ProductsSummary,
  StockState,
} from '@/features/store/domain/entities/product'

/** The columns the server will order by. Anything else is a `400`, not an ignore. */
export type ProductOrderingField = 'name' | 'sku' | 'category' | 'price' | 'stock' | 'created_at'
export type ProductOrdering = ProductOrderingField | `-${ProductOrderingField}`

/**
 * Every filter here is applied by the server. Nothing is filtered or sorted on
 * the client: the list is paged and its tiles are counted over the whole
 * filtered catalogue, so narrowing one page would report a page as the total.
 */
export interface ProductFilters {
  /**
   * Partial and case-insensitive over product name **and SKU** — and it matches
   * *any* variant's SKU, not just the primary one, so a code read off a shelf
   * label finds the product it belongs to. It does not search category names.
   */
  readonly search?: string
  /** A category id. The dropdown sends the id. */
  readonly category?: number
  readonly status?: ProductStatus
  /** The tile click-through. Deliberately not counted into `summary` — see `ProductPage`. */
  readonly stockState?: StockState
  /** Alphabetical by name when omitted, which is how the screen opens. */
  readonly ordering?: ProductOrdering
  readonly page?: number
  /** 20 by default, 100 max server-side. */
  readonly pageSize?: number
}

export interface ProductPage {
  /** The filtered total **including** `stockState` — what pagination runs on. */
  readonly count: number
  readonly results: readonly ProductRow[]
  /**
   * Counted over `search`, `category` and `status` but **not** over
   * `stockState`, because a tile is how you apply that filter and counting it
   * into its own total would zero the other three the moment one was clicked.
   *
   * So `summary.total` and `count` legitimately diverge while a stock tile is
   * active: label the tiles from `summary`, page from `count`.
   */
  readonly summary: ProductsSummary
}

/**
 * What the product form writes.
 *
 * One call covers what the API keeps in three tables — the product, the variant
 * carrying its price and SKU, and its pictures — in one transaction, so a
 * half-saved product cannot exist. Notably absent: a **SKU**, which the server
 * issues from the category's prefix and counter, and **stock**, which a new
 * product never has (fill it with `adjustStock`, so the change is logged).
 */
export interface ProductWrite {
  readonly name: string
  readonly category?: number | null
  /** The variant's. Defaults to `0.00` server-side, as the form's field does. */
  readonly price?: number
  readonly description?: string
  readonly status?: ProductWritableStatus
  readonly lowStockThreshold?: number
  /** New files to upload. Repeated `images` key, multipart. */
  readonly images?: readonly File[]
  /** Existing `ProductImage` ids to drop — also removes them from the CDN. */
  readonly removeImages?: readonly number[]
}

export interface ProductRepository {
  fetchProducts(filters?: ProductFilters): Promise<Result<ProductPage>>
  /** One product in full — the row plus `description` and `images`. */
  fetchProduct(productId: number): Promise<Result<ProductDetail>>
  createProduct(input: ProductWrite): Promise<Result<ProductDetail>>
  updateProduct(productId: number, input: Partial<ProductWrite>): Promise<Result<ProductDetail>>
  deleteProduct(productId: number): Promise<Result<void>>
  /**
   * Writes the product's status and nothing else, and answers with the whole
   * row. Kept narrow on purpose: a switch on a list screen must not quietly
   * send a stale copy of every other field back with it.
   */
  setProductStatus(productId: number, status: ProductWritableStatus): Promise<Result<ProductRow>>
  /**
   * Moves stock and logs why. Answers with the product as it now stands, so the
   * caller never has to refetch to learn the new quantity or state.
   *
   * Refused for: no reason, both or neither of quantity/delta, a change of
   * zero, and any result below zero.
   */
  adjustStock(productId: number, input: StockAdjustmentInput): Promise<Result<ProductDetail>>
  /**
   * The adjustment history, newest first. Behind `view_stock`, which the
   * catalogue's owner deliberately does not hold — do not fetch it without.
   */
  fetchStockHistory(productId: number): Promise<Result<readonly StockAdjustmentEntry[]>>
}
