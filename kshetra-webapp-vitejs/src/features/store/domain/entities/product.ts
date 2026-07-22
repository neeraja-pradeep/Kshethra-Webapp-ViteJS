/** A store product — catalogue entry with pricing and inventory. */

export type ProductStatus = 'Active' | 'Inactive'

/** Derived stock band shown as a badge; never stored, always computed. */
export type StockLevel = 'In stock' | 'Low stock' | 'Out of stock'

/** One entry in a product's stock-adjustment history. */
export interface StockLogEntry {
  readonly change: string
  readonly reason: string
  readonly who: string
}

export interface Product {
  readonly id: string // SKU, e.g. "INC-001"
  readonly name: string
  readonly categoryId: string
  readonly price: number
  readonly stock: number
  readonly lowStockThreshold: number
  readonly status: ProductStatus
  readonly description: string
  readonly images: readonly string[]
  readonly stockLog: readonly StockLogEntry[]
}
