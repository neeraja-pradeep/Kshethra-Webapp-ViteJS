import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { productKeys } from '@/features/store/application/queries/product.keys'
import { fetchProduct } from '@/features/store/application/usecases/fetchProduct'
import { fetchProducts } from '@/features/store/application/usecases/fetchProducts'
import { fetchStockHistory } from '@/features/store/application/usecases/fetchStockHistory'
import type { ProductFilters } from '@/features/store/domain/repositories/product.repository'

/**
 * One page of the catalogue, tiles included.
 *
 * `keepPreviousData` stops the table blanking on every keystroke, page turn and
 * filter change: the previous page stays put, dimmed by the caller, until the
 * new one lands.
 */
export function useProductsQuery(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => unwrap(await fetchProducts(filters)),
    placeholderData: keepPreviousData,
  })
}

/** One product in full. Skipped until a row is actually opened. */
export function useProductDetailQuery(productId: number | null) {
  return useQuery({
    queryKey: productKeys.detail(productId ?? 0),
    queryFn: async () => unwrap(await fetchProduct(productId as number)),
    enabled: productId != null,
  })
}

/**
 * The stock adjustment history.
 *
 * Gated by the caller, not just hidden: it needs `view_stock`, which the
 * catalogue's owner (App Manager) deliberately does not hold — firing this
 * query for them would 403 on their own screen.
 */
export function useStockHistoryQuery(productId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: productKeys.stockHistory(productId ?? 0),
    queryFn: async () => unwrap(await fetchStockHistory(productId as number)),
    enabled: enabled && productId != null,
  })
}
