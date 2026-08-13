import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { ProductDetail, ProductRow, ProductWritableStatus } from '@/features/store/domain/entities/product'
import type {
  StockAdjustmentEntry,
  StockAdjustmentInput,
} from '@/features/store/domain/entities/stock-adjustment'
import type {
  ProductFilters,
  ProductPage,
  ProductRepository,
  ProductWrite,
} from '@/features/store/domain/repositories/product.repository'
import {
  toProductDetail,
  toProductRow,
  toProductsSummary,
} from '@/features/store/infrastructure/data-sources/remote/product.response'
import { toStockAdjustmentEntry } from '@/features/store/infrastructure/data-sources/remote/stockAdjustment.response'
import {
  deleteProductRequest,
  getProduct,
  getProducts,
  patchProduct,
  getStockHistory,
  patchProductStatus,
  postProduct,
  postStockAdjustment,
} from '@/features/store/infrastructure/data-sources/remote/products.api'

export const productRepository: ProductRepository = {
  async fetchProducts(filters: ProductFilters = {}): Promise<Result<ProductPage>> {
    try {
      const page = await getProducts(filters)
      return ok({
        count: page.count,
        results: page.results.map(toProductRow),
        summary: toProductsSummary(page.summary),
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchProduct(productId: number): Promise<Result<ProductDetail>> {
    try {
      return ok(toProductDetail(await getProduct(productId)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createProduct(input: ProductWrite): Promise<Result<ProductDetail>> {
    try {
      return ok(toProductDetail(await postProduct(input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async updateProduct(productId: number, input: Partial<ProductWrite>): Promise<Result<ProductDetail>> {
    try {
      return ok(toProductDetail(await patchProduct(productId, input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async deleteProduct(productId: number): Promise<Result<void>> {
    try {
      await deleteProductRequest(productId)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setProductStatus(productId: number, status: ProductWritableStatus): Promise<Result<ProductRow>> {
    try {
      return ok(toProductRow(await patchProductStatus(productId, status)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async adjustStock(productId: number, input: StockAdjustmentInput): Promise<Result<ProductDetail>> {
    try {
      return ok(toProductDetail(await postStockAdjustment(productId, input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchStockHistory(productId: number): Promise<Result<readonly StockAdjustmentEntry[]>> {
    try {
      return ok((await getStockHistory(productId)).map(toStockAdjustmentEntry))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
