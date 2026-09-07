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
 * Two queries because `stock_state` takes a single value: out-of-stock and
 * low-stock are separate filters server-side, and there is no combined one.
 * They are merged here rather than by asking for the whole catalogue and
 * filtering it, which would page-truncate on a shop of any size.
 *
 * `status=active` is what keeps a delisted product off the card: a product
 * nobody can buy is not an inventory alert, however empty its shelf.
 *
 * `enabled` is the caller's `view_product` check. A dashboard viewer without it
 * would otherwise 403 twice on a screen they are allowed to see.
 */

/** Enough rows to fill the card and still count the "+N more" behind it. */
const LOW_STOCK_FETCH_SIZE = 50
/** Most urgent first — the server sorts ascending on the stock quantity. */
const STOCK_ASCENDING = 'stock'

export function useLowStockQuery(enabled: boolean) {
  const outOfStockQuery = useProductsQuery({
    stockState: 'out_of_stock',
    status: 'active',
    ordering: STOCK_ASCENDING,
    pageSize: LOW_STOCK_FETCH_SIZE,
  }, enabled)

  const lowStockQuery = useProductsQuery({
    stockState: 'low_stock',
    status: 'active',
    ordering: STOCK_ASCENDING,
    pageSize: LOW_STOCK_FETCH_SIZE,
  }, enabled)

  /**
   * Out-of-stock first, then low-stock — both already stock-ascending, so
   * concatenating preserves urgency order without a second sort. A product with
   * no variant has no SKU; it is dropped rather than keyed on an empty string,
   * which would collide with every other variant-less product in the list.
   */
  const items = useMemo<LowStockItem[]>(() => {
    const rows = [...(outOfStockQuery.data?.results ?? []), ...(lowStockQuery.data?.results ?? [])]
    return rows.flatMap((row) =>
      row.sku === null ? [] : [{ sku: row.sku, name: row.name, stock: row.stockQuantity }],
    )
  }, [outOfStockQuery.data, lowStockQuery.data])

  return {
    items,
    /** The unfiltered totals, so "+N more" counts what the card did not draw. */
    total: (outOfStockQuery.data?.count ?? 0) + (lowStockQuery.data?.count ?? 0),
    isPending: enabled && (outOfStockQuery.isPending || lowStockQuery.isPending),
    isError: outOfStockQuery.isError || lowStockQuery.isError,
    error: outOfStockQuery.error ?? lowStockQuery.error,
  }
}
