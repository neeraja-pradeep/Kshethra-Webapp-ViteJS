import type { BadgeColor } from '@/shared/ui'

import type { Category } from '@/features/store/domain/entities/category'
import type { FulfilmentStage, Order, PaymentState } from '@/features/store/domain/entities/order'
import type { Product, StockLevel } from '@/features/store/domain/entities/product'

/** "2026-07-01" → "1 Jul 2026". Invalid input passes through unchanged. */
export function formatOrderDate(iso: string): string {
  const parts = iso.split('-').map(Number)
  if (parts.length < 3 || parts.some((p) => Number.isNaN(p))) return iso
  const [y, m, d] = parts
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "28 Jun 2026, 3:12 pm"-style stamp for audit trails (refunds, stock log). */
export function nowStamp(): string {
  const d = new Date()
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return `${date}, ${time}`
}

export function findProduct(products: readonly Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function findCategory(categories: readonly Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}

export function categoryName(categories: readonly Category[], id: string): string {
  return findCategory(categories, id)?.name ?? '—'
}

export interface ResolvedOrderLine {
  readonly productId: string
  readonly name: string
  readonly category: string
  readonly quantity: number
  readonly unitPrice: number
  readonly lineTotal: number
}

export function resolveOrderItems(order: Order, products: readonly Product[], categories: readonly Category[]): ResolvedOrderLine[] {
  return order.items.map((it) => {
    const p = findProduct(products, it.productId)
    return {
      productId: it.productId,
      name: p?.name ?? it.productId,
      category: p ? categoryName(categories, p.categoryId) : '',
      quantity: it.quantity,
      unitPrice: p?.price ?? 0,
      lineTotal: (p?.price ?? 0) * it.quantity,
    }
  })
}

export function orderQuantity(order: Order): number {
  return order.items.reduce((sum, it) => sum + it.quantity, 0)
}

export function orderTotal(order: Order, products: readonly Product[]): number {
  return order.items.reduce((sum, it) => sum + (findProduct(products, it.productId)?.price ?? 0) * it.quantity, 0)
}

export function stockLevel(product: Pick<Product, 'stock' | 'lowStockThreshold'>): { label: StockLevel; color: BadgeColor } {
  if (product.stock <= 0) return { label: 'Out of stock', color: 'red' }
  if (product.stock <= (product.lowStockThreshold || 10)) return { label: 'Low stock', color: 'amber' }
  return { label: 'In stock', color: 'green' }
}

export function paymentBadgeColor(status: PaymentState): BadgeColor {
  if (status === 'Paid') return 'green'
  if (status === 'Pending') return 'amber'
  if (status === 'Partially Refunded') return 'blue'
  return 'gray'
}

export function fulfilmentBadgeColor(status: FulfilmentStage): BadgeColor {
  if (status === 'Delivered') return 'green'
  if (status === 'Shipped') return 'blue'
  if (status === 'Packed') return 'amber'
  if (status === 'Cancelled') return 'red'
  return 'gray'
}

/** Tailwind background class for the small fulfilment-stage status dot. */
export function fulfilmentDotClass(status: FulfilmentStage): string {
  if (status === 'Delivered') return 'bg-success'
  if (status === 'Shipped') return 'bg-info'
  if (status === 'Packed') return 'bg-warning'
  if (status === 'Cancelled') return 'bg-danger'
  return 'bg-primary'
}

export function productHasOrders(orders: readonly Order[], productId: string): boolean {
  return orders.some((o) => o.items.some((it) => it.productId === productId))
}

export function categoryHasProducts(products: readonly Product[], categoryId: string): boolean {
  return products.some((p) => p.categoryId === categoryId)
}

/** An order placed with no account holder — a walk-in / counter sale. */
export function isWalkInOrder(order: Order): boolean {
  return !order.customer
}

/** Full refund / cancellation closes an order to further refunds. */
export function isRefundResolved(order: Order): boolean {
  return order.paymentStatus === 'Refunded' || order.fulfilmentStatus === 'Cancelled'
}
