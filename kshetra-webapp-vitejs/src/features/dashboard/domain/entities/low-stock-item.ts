/**
 * A product at or below the store's low-stock threshold. Mirrors the Store
 * module's inventory seed; `stock === 0` renders as "Out of stock", anything
 * else as "Low stock" (derived in the UI, not stored).
 */
export interface LowStockItem {
  readonly sku: string
  readonly name: string
  readonly stock: number
}
