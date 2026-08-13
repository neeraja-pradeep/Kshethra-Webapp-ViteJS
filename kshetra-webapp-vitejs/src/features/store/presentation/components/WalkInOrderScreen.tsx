import { useEffect, useMemo, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Alert, Icon, Spinner } from '@/shared/ui'

import { useCategoriesQuery } from '@/features/store/application/queries/useCategoriesQuery'
import { useProductsQuery } from '@/features/store/application/queries/useProductsQuery'
import { useCreateWalkInSaleMutation } from '@/features/store/application/queries/useStoreOrderMutations'
import type { ProductRow } from '@/features/store/domain/entities/product'
import type { StoreOrderDetail, WalkInPaymentMethod } from '@/features/store/domain/entities/store-order'
import type { StockShortfall } from '@/features/store/domain/repositories/storeOrder.repository'
import { readShortfalls } from '@/features/store/infrastructure/repositories/storeOrder.repository.impl'

import { DetailTopBar } from './DetailTopBar'
import { WalkInPaymentModal } from './WalkInPaymentModal'

const SEARCH_DEBOUNCE_MS = 300
/** The picker is a grid to tap, not a list to page — one generous page covers it. */
const PICKER_PAGE_SIZE = 60

export interface WalkInOrderScreenProps {
  onClose: () => void
  /** Opens the receipt for the order that was just taken. */
  onSold: (order: StoreOrderDetail) => void
}

/** A cart line is keyed by **variant** — that is what is actually sold. */
interface CartLine {
  readonly variantId: number
  readonly name: string
  readonly sku: string
  readonly price: number
  /** What the catalogue said when it was added; the server is still the authority. */
  readonly stock: number
  readonly quantity: number
}

/**
 * Over-the-counter POS: browse the catalogue, build a cart, take payment.
 *
 * The old screen never consulted stock and would happily sell an out-of-stock
 * line any number of times. Quantities are now capped at what the catalogue
 * shows — and, because that figure can be stale and the server counts live app
 * reservations out, a refusal comes back naming each short line.
 */
export function WalkInOrderScreen({ onClose, onSold }: WalkInOrderScreenProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [browseCat, setBrowseCat] = useState<number | null>(null)
  const [cart, setCart] = useState<readonly CartLine[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [payOpen, setPayOpen] = useState(false)

  const createSale = useCreateWalkInSaleMutation()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const productsQuery = useProductsQuery(
    useMemo(
      () => ({
        status: 'active' as const,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(browseCat ? { category: browseCat } : {}),
        page: 1,
        pageSize: PICKER_PAGE_SIZE,
      }),
      [debouncedSearch, browseCat],
    ),
  )
  const categoriesQuery = useCategoriesQuery()

  const results = productsQuery.data?.results ?? []
  const activeCategories = (categoriesQuery.data ?? []).filter((c) => c.status === 'active')

  const failure = toFailure(createSale.error)
  const shortfalls = readShortfalls(failure)
  const shortfallByVariant = new Map(shortfalls.map((s) => [s.productVariant, s]))

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  /** One line per variant — listing the same one twice is refused, so quantities combine. */
  function addToCart(product: ProductRow) {
    if (product.variantId == null) return
    const variantId = product.variantId
    setCart((current) => {
      const existing = current.find((line) => line.variantId === variantId)
      if (existing) {
        return current.map((line) =>
          line.variantId === variantId
            ? { ...line, quantity: Math.min(line.stock, line.quantity + 1) }
            : line,
        )
      }
      return [
        ...current,
        {
          variantId,
          name: product.name,
          sku: product.sku ?? '',
          price: product.price ?? 0,
          stock: product.stockQuantity,
          quantity: 1,
        },
      ]
    })
  }

  const setQuantity = (variantId: number, next: number) =>
    setCart((c) =>
      c.map((line) =>
        line.variantId === variantId
          ? { ...line, quantity: Math.max(1, Math.min(line.stock, next)) }
          : line,
      ),
    )
  const remove = (variantId: number) => setCart((c) => c.filter((line) => line.variantId !== variantId))

  function handleConfirm(method: WalkInPaymentMethod) {
    createSale.mutate(
      {
        ...(name.trim() ? { customerName: name.trim() } : {}),
        ...(phone.trim() ? { customerPhone: phone.trim() } : {}),
        paymentMethod: method,
        items: cart.map((line) => ({ productVariant: line.variantId, quantity: line.quantity })),
      },
      {
        onSuccess: (order) => {
          setPayOpen(false)
          setCart([])
          setName('')
          setPhone('')
          onSold(order)
        },
        // On failure the modal stays open and the cart is untouched — the sale
        // was one transaction, so nothing was written and nothing is lost.
      },
    )
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || payOpen) return
      onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

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

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="flex-shrink-0 border-b border-stroke-subtle px-4 pb-3 pt-3.5">
            <div className="flex h-10 items-center gap-2 rounded-lg bg-card px-2.5 shadow-xs">
              <Icon name="magnifying-glass" size={16} className="text-ink-subtle" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or SKU…"
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
                  browseCat
                    ? 'bg-card text-ink ring-1 ring-inset ring-stroke'
                    : 'bg-primary-subtle text-primary-subtle-text ring-2 ring-inset ring-primary',
                )}
              >
                All
              </button>
              {activeCategories.map((category) => {
                const on = browseCat === category.id
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setBrowseCat(on ? null : category.id)}
                    className={cn(
                      'rounded-full border-none px-2.75 py-1.25 font-sans text-xs font-medium',
                      on
                        ? 'bg-primary-subtle text-primary-subtle-text ring-2 ring-inset ring-primary'
                        : 'bg-card text-ink ring-1 ring-inset ring-stroke',
                    )}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>

          {productsQuery.isPending ? (
            <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-3 text-ink-subtle">
              <Spinner size={24} />
              <span className="text-sm">Loading catalogue…</span>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(190px,1fr))] content-start gap-2.5 overflow-y-auto p-3.5">
              {results.map((product) => {
                // Nothing sellable without a variant, and nothing to sell at zero.
                const sellable = product.variantId != null && product.stockQuantity > 0
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={!sellable}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'flex min-h-[88px] flex-col justify-between gap-3 rounded-lg border-none p-3.25 text-left shadow-xs transition-shadow duration-120 ease-ks',
                      sellable
                        ? 'cursor-pointer bg-card hover:bg-hover hover:shadow-sm'
                        : 'cursor-not-allowed bg-sunken opacity-60',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-snug text-ink-strong">{product.name}</span>
                      <span className="mt-0.5 block text-2xs text-ink-subtle">
                        {product.sku ?? 'No SKU'} ·{' '}
                        {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="tabular-nums text-base font-bold text-ink-strong">
                        {product.price == null ? '—' : formatINR(product.price)}
                      </span>
                      {sellable && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary-subtle text-primary">
                          <Icon name="plus" size={14} />
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
              {results.length === 0 && (
                <div className="col-span-full py-7.5 text-center text-sm text-ink-subtle">
                  No active products match.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex w-[340px] flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-stroke px-4.5 py-3.75">
            <Icon name="shopping-cart-simple" size={18} className="text-primary" />
            <span className="text-base font-semibold text-ink-strong">Cart</span>
            <div className="flex-1" />
            <span className="text-xs text-ink-subtle">{cartCount} items</span>
          </div>

          {/* A refused sale names each short line — shown against the line itself
              rather than flattened into one message. */}
          {shortfalls.length > 0 && (
            <div className="border-b border-stroke px-3 py-2.5">
              <Alert type="danger" title="Not enough stock">
                <div className="flex flex-col gap-0.5">
                  {shortfalls.map((s: StockShortfall) => (
                    <span key={s.productVariant} className="text-xs">
                      {s.name}: asked {s.requested}, {s.available} left
                    </span>
                  ))}
                </div>
              </Alert>
            </div>
          )}

          {cart.length > 0 ? (
            <>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.75">
                {cart.map((line) => {
                  const short = shortfallByVariant.get(line.variantId)
                  const atCap = line.quantity >= line.stock
                  return (
                    <div
                      key={line.variantId}
                      className={cn(
                        'flex flex-col gap-2 rounded-lg px-2.75 py-2.75',
                        short ? 'bg-danger-surface' : 'bg-active',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-ink-strong">{line.name}</div>
                          <div className="text-xs text-ink-subtle">
                            {formatINR(line.price)} each · {short ? `${short.available} left` : `${line.stock} in stock`}
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => remove(line.variantId)}
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
                            disabled={line.quantity <= 1}
                            onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                            className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-sm border-none bg-transparent text-ink-muted hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon name="minus" size={13} />
                          </button>
                          <span className="min-w-6.5 text-center tabular-nums text-sm font-semibold text-ink-strong">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase"
                            disabled={atCap}
                            title={atCap ? 'That is all the shelf has' : undefined}
                            onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                            className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-sm border-none bg-transparent text-ink-muted hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon name="plus" size={13} />
                          </button>
                        </div>
                        <div className="flex-1" />
                        <span className="tabular-nums text-base font-bold text-ink-strong">
                          {formatINR(line.price * line.quantity)}
                        </span>
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
              <span className="inline-flex h-[58px] w-[58px] items-center justify-center rounded-3xl bg-sunken text-ink-subtle ring-1 ring-inset ring-stroke-subtle">
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

      <WalkInPaymentModal
        open={payOpen}
        total={total}
        saving={createSale.isPending}
        errorMessage={shortfalls.length > 0 ? null : failure?.message ?? null}
        onClose={() => setPayOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
