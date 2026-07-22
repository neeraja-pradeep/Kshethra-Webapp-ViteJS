import { useMemo, useState } from 'react'

import { formatINR } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui'

import type { Category } from '@/features/store/domain/entities/category'
import type { Order, WalkInCartLine } from '@/features/store/domain/entities/order'
import type { Product } from '@/features/store/domain/entities/product'
import { categoryName, findProduct } from '@/features/store/presentation/lib/storeFormat'

import { DetailTopBar } from './DetailTopBar'
import { WalkInPaymentModal } from './WalkInPaymentModal'
import { WalkInReceiptModal } from './WalkInReceiptModal'

export interface WalkInOrderScreenProps {
  products: readonly Product[]
  categories: readonly Category[]
  templeName: string
  onClose: () => void
  onConfirm: (cart: WalkInCartLine[], name: string, phone: string, method: string) => Order
  onPrintReceipt: (order: Order) => void
}

/** Over-the-counter POS: search/browse products, build a cart, take payment, print a receipt. */
export function WalkInOrderScreen({ products, categories, templeName, onClose, onConfirm, onPrintReceipt }: WalkInOrderScreenProps) {
  const [search, setSearch] = useState('')
  const [browseCat, setBrowseCat] = useState<string | null>(null)
  const [cart, setCart] = useState<WalkInCartLine[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)

  const activeProducts = useMemo(() => products.filter((p) => p.status === 'Active'), [products])
  const activeCategories = useMemo(() => categories.filter((c) => c.status === 'Active'), [categories])

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    let res = activeProducts
    if (browseCat) res = res.filter((p) => p.categoryId === browseCat)
    if (q) res = res.filter((p) => `${p.name} ${p.id} ${categoryName(categories, p.categoryId)}`.toLowerCase().includes(q))
    return res.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60)
  }, [activeProducts, browseCat, search, categories])

  const addToCart = (productId: string) =>
    setCart((c) => {
      const ex = c.find((l) => l.productId === productId)
      if (ex) return c.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l))
      return c.concat([{ productId, quantity: 1 }])
    })
  const inc = (productId: string) => setCart((c) => c.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l)))
  const dec = (productId: string) => setCart((c) => c.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, l.quantity - 1) } : l)))
  const remove = (productId: string) => setCart((c) => c.filter((l) => l.productId !== productId))

  const total = cart.reduce((sum, l) => sum + (findProduct(products, l.productId)?.price ?? 0) * l.quantity, 0)
  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0)

  const handleConfirm = (method: string) => {
    const created = onConfirm(cart, name.trim(), phone.trim(), method)
    setReceiptOrder(created)
    setCart([])
    setPayOpen(false)
  }
  const handleNewSale = () => {
    setReceiptOrder(null)
    setCart([])
    setSearch('')
    setBrowseCat(null)
    setName('')
    setPhone('')
  }
  const handleDone = () => {
    setReceiptOrder(null)
    onClose()
  }

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DetailTopBar
        section="Store · Orders"
        title="New walk-in order"
        onBack={onClose}
        badges={
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.75 py-1.25 text-xs text-ink-subtle shadow-xs">
            <Icon name="storefront" size={14} />
            Over-the-counter sale
          </span>
        }
      />

      <div className="flex min-h-0 flex-1 gap-4 p-4 pt-4">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="flex-shrink-0 border-b border-stroke-subtle px-4 pb-3 pt-3.5">
            <div className="flex h-10 items-center gap-2 rounded-lg bg-card px-2.5 shadow-xs">
              <Icon name="magnifying-glass" size={16} className="text-ink-subtle" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, SKU, or category…"
                className="h-full min-w-0 flex-1 border-none bg-transparent text-base text-ink-strong outline-none"
              />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 text-xs text-ink-subtle">Browse:</span>
              <button
                type="button"
                onClick={() => setBrowseCat(null)}
                className={cn(
                  'rounded-full border-none px-2.75 py-1.25 font-sans text-xs font-medium',
                  browseCat ? 'bg-card text-ink ring-1 ring-inset ring-stroke' : 'bg-primary-subtle text-primary-subtle-text ring-2 ring-inset ring-primary',
                )}
              >
                All
              </button>
              {activeCategories.map((c) => {
                const on = browseCat === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setBrowseCat(on ? null : c.id)}
                    className={cn(
                      'rounded-full border-none px-2.75 py-1.25 font-sans text-xs font-medium',
                      on ? 'bg-primary-subtle text-primary-subtle-text ring-2 ring-inset ring-primary' : 'bg-card text-ink ring-1 ring-inset ring-stroke',
                    )}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(190px,1fr))] content-start gap-2.5 overflow-y-auto p-3.5">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p.id)}
                className="flex min-h-22 flex-col justify-between gap-3 rounded-lg border-none bg-card p-3.25 text-left shadow-xs transition-shadow duration-120 ease-ks hover:bg-hover hover:shadow-sm"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug text-ink-strong">{p.name}</span>
                  <span className="mt-0.5 block text-2xs text-ink-subtle">{categoryName(categories, p.categoryId)}</span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="tabular-nums text-base font-bold text-ink-strong">{formatINR(p.price)}</span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary-subtle text-primary">
                    <Icon name="plus" size={14} />
                  </span>
                </span>
              </button>
            ))}
            {results.length === 0 && <div className="col-span-full py-7.5 text-center text-sm text-ink-subtle">No active products match.</div>}
          </div>
        </div>

        <div className="flex w-[340px] flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-stroke px-4.5 py-3.75">
            <Icon name="shopping-cart-simple" size={18} className="text-primary" />
            <span className="text-base font-semibold text-ink-strong">Cart</span>
            <div className="flex-1" />
            <span className="text-xs text-ink-subtle">{cartCount} items</span>
          </div>

          {cart.length > 0 ? (
            <>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.75">
                {cart.map((l) => {
                  const p = findProduct(products, l.productId)
                  const price = p?.price ?? 0
                  return (
                    <div key={l.productId} className="flex flex-col gap-2 rounded-lg bg-active px-2.75 py-2.75">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-ink-strong">{p?.name ?? l.productId}</div>
                          <div className="text-xs text-ink-subtle">{formatINR(price)} each</div>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => remove(l.productId)}
                          className="inline-flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-subtle hover:bg-danger-surface hover:text-danger"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-0.5 rounded-md bg-card p-0.5 shadow-xs">
                          <button
                            type="button"
                            aria-label="Decrease"
                            disabled={l.quantity <= 1}
                            onClick={() => dec(l.productId)}
                            className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-sm border-none bg-transparent text-ink-muted hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon name="minus" size={13} />
                          </button>
                          <span className="min-w-6.5 text-center tabular-nums text-sm font-semibold text-ink-strong">{l.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => inc(l.productId)}
                            className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-sm border-none bg-transparent text-ink-muted hover:bg-hover"
                          >
                            <Icon name="plus" size={13} />
                          </button>
                        </div>
                        <div className="flex-1" />
                        <span className="tabular-nums text-base font-bold text-ink-strong">{formatINR(price * l.quantity)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex-shrink-0 border-t border-stroke bg-sunken px-4.5 py-4">
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name (optional)"
                    className="h-8 min-w-0 flex-1 rounded-md border-none bg-card px-2.5 font-sans text-sm text-ink shadow-xs outline-none"
                  />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="h-8 min-w-0 flex-1 rounded-md border-none bg-card px-2.5 font-sans text-sm text-ink shadow-xs outline-none"
                  />
                </div>
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Cart total</span>
                  <span className="text-3xl font-bold tabular-nums text-ink-strong">{formatINR(total)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPayOpen(true)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md border-none bg-primary font-sans text-base font-medium text-primary-contrast hover:bg-primary-hover"
                >
                  <Icon name="credit-card" size={17} />
                  Take payment
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-7 py-9 text-center">
              <span className="inline-flex h-14.5 w-14.5 items-center justify-center rounded-3xl bg-sunken text-ink-subtle ring-1 ring-inset ring-stroke-subtle">
                <Icon name="shopping-cart-simple" size={26} />
              </span>
              <div>
                <div className="text-base font-semibold text-ink">Cart is empty</div>
                <div className="mt-1 text-sm leading-snug text-ink-subtle">Search a product and tap to add it.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <WalkInPaymentModal open={payOpen} total={total} onClose={() => setPayOpen(false)} onConfirm={handleConfirm} />
      <WalkInReceiptModal
        order={receiptOrder}
        products={products}
        categories={categories}
        templeName={templeName}
        onDone={handleDone}
        onNewSale={handleNewSale}
        onPrint={() => receiptOrder && onPrintReceipt(receiptOrder)}
      />
    </div>
  )
}
