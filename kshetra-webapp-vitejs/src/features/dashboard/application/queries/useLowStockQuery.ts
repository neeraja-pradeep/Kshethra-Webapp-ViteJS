import { useMemo } from 'react'

import type { LowStockItem } from '@/features/dashboard/domain/entities/low-stock-item'
import { useProductsQuery } from '@/features/store/application/queries/useProductsQuery'

/**
 * The inventory card's stock alerts.
 *
 * The dashboard endpoint deliberately does not serve these — the store's own
 * product list already answers the question through `stock_state`, and
 * duplicating the threshold logic in a second place is how the two screens
 * would come to disagree about what "low" means.
 *
 * One request: `stock_state` takes a list, ORed server-side, so out-of-stock
 * and low-stock arrive together already sorted. Asking for the whole catalogue
 * and filtering it here would page-truncate on a shop of any size.
 *
 * `status=active` is what keeps a delisted product off the card: a product
 * nobody can buy is not an inventory alert, however empty its shelf.
 *
 * `enabled` is the caller's `view_product` check. A dashboard viewer without it
 * would otherwise 403 on a screen they are allowed to see.
 */

/** Enough rows to fill the card and still count the "+N more" behind it. */
const LOW_STOCK_FETCH_SIZE = 50
/**
 * Most urgent first — the server sorts ascending on the stock quantity, and
 * out-of-stock is zero, so the emptiest shelves lead without a second sort.
 */
const STOCK_ASCENDING = 'stock'
/** Both states the card reports on, ORed by the server into one page. */
const NEEDS_ATTENTION = ['out_of_stock', 'low_stock'] as const

export function useLowStockQuery(enabled: boolean) {
  const query = useProductsQuery(
    {
      stockState: NEEDS_ATTENTION,
      status: 'active',
      ordering: STOCK_ASCENDING,
      pageSize: LOW_STOCK_FETCH_SIZE,
    },
    enabled,
  )

  /**
   * A product with no variant has no SKU; it is dropped rather than keyed on an
   * empty string, which would collide with every other variant-less product.
   */
  const items = useMemo<LowStockItem[]>(
    () =>
      (query.data?.results ?? []).flatMap((row) =>
        row.sku === null ? [] : [{ sku: row.sku, name: row.name, stock: row.stockQuantity }],
      ),
    [query.data],
  )

  return {
    items,
    /** The unfiltered total, so "+N more" counts what the card did not draw. */
    total: query.data?.count ?? 0,
    isPending: enabled && query.isPending,
    isError: query.isError,
    error: query.error,
  }
}
