import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { categoryKeys } from '@/features/store/application/queries/category.keys'
import { productKeys } from '@/features/store/application/queries/product.keys'
import { adjustStock } from '@/features/store/application/usecases/adjustStock'
import { createProduct } from '@/features/store/application/usecases/createProduct'
import { deleteProduct } from '@/features/store/application/usecases/deleteProduct'
import { setProductStatus } from '@/features/store/application/usecases/setProductStatus'
import { updateProduct } from '@/features/store/application/usecases/updateProduct'
import type { ProductDetail, ProductWritableStatus } from '@/features/store/domain/entities/product'
import type { StockAdjustmentInput } from '@/features/store/domain/entities/stock-adjustment'
import type { ProductWrite } from '@/features/store/domain/repositories/product.repository'

/**
 * The form's writes answer with the whole product, so the detail cache is
 * written from the response rather than refetched.
 *
 * The lists are invalidated rather than patched: the stock tiles are counted
 * server-side over the filtered catalogue, and a rename or a category move can
 * change which page a row even belongs on. Categories go too — a product moving
 * between them changes two `product_count`s.
 */
function useProductWriteSuccess() {
  const queryClient = useQueryClient()
  return (detail: ProductDetail) => {
    queryClient.setQueryData(productKeys.detail(detail.id), detail)
    void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
  }
}

export function useCreateProductMutation() {
  const onWritten = useProductWriteSuccess()
  return useMutation({
    mutationFn: async (input: ProductWrite) => unwrap(await createProduct(input)),
    onSuccess: onWritten,
  })
}

export function useUpdateProductMutation() {
  const onWritten = useProductWriteSuccess()
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: Partial<ProductWrite> }) =>
      unwrap(await updateProduct(id, input)),
    onSuccess: onWritten,
  })
}

/**
 * The toggle answers with the row, but the list is still invalidated rather
 * than patched: with a status filter on, flipping a product changes whether it
 * belongs in the result at all, and a patched row would leave a stale total.
 */
export function useSetProductStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ProductWritableStatus }) =>
      unwrap(await setProductStatus(id, status)),
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(row.id) })
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productId: number) => unwrap(await deleteProduct(productId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

/**
 * Adjusting stock.
 *
 * The response is the updated product, so the detail cache is written from it.
 * The lists still have to be invalidated: stock moves `stock_state`, which
 * moves the tiles — and those are counted server-side over the whole filtered
 * catalogue, so no client-side patch could reproduce them.
 */
export function useAdjustStockMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: StockAdjustmentInput }) =>
      unwrap(await adjustStock(id, input)),
    onSuccess: (detail) => {
      queryClient.setQueryData(productKeys.detail(detail.id), detail)
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: productKeys.stockHistory(detail.id) })
    },
  })
}
