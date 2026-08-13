import { http } from '@/core/api/http'
import { MULTIPART_REQUEST, toFormData, type MultipartValue } from '@/core/api/multipart'
import { STORE_ENDPOINTS } from '@/core/config/endpoints'

import type { ProductWritableStatus } from '@/features/store/domain/entities/product'
import type { StockAdjustmentInput } from '@/features/store/domain/entities/stock-adjustment'

import type { ProductFilters, ProductWrite } from '@/features/store/domain/repositories/product.repository'
import {
  productDetailSchema,
  productPageResponseSchema,
  productRowSchema,
  type ProductDetailDto,
  type ProductRowDto,
} from '@/features/store/infrastructure/data-sources/remote/product.response'
import {
  stockHistoryResponseSchema,
  type StockAdjustmentDto,
} from '@/features/store/infrastructure/data-sources/remote/stockAdjustment.response'

/** Only keys the caller actually set are sent — an empty one means "no filter". */
function toParams(filters: ProductFilters): Record<string, string | number> {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.stockState ? { stock_state: filters.stockState } : {}),
    ...(filters.ordering ? { ordering: filters.ordering } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.pageSize ? { page_size: filters.pageSize } : {}),
  }
}

export async function getProducts(filters: ProductFilters = {}) {
  const response = await http.get(STORE_ENDPOINTS.products, { params: toParams(filters) })
  return productPageResponseSchema.parse(response.data)
}

export async function getProduct(productId: number): Promise<ProductDetailDto> {
  const response = await http.get(STORE_ENDPOINTS.product(productId))
  return productDetailSchema.parse(response.data)
}

/**
 * Only keys the caller actually set are sent, so a patch changes nothing else.
 *
 * Price goes as a fixed 2-decimal string: the field is a `DecimalField`, and
 * `1299.5` would arrive a rupee-and-a-half short of what was typed.
 */
function toBody(input: Partial<ProductWrite>): Record<string, MultipartValue | readonly MultipartValue[]> {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.price !== undefined ? { price: input.price.toFixed(2) } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.lowStockThreshold !== undefined ? { low_stock_threshold: input.lowStockThreshold } : {}),
    ...(input.images?.length ? { images: [...input.images] } : {}),
    ...(input.removeImages?.length ? { remove_images: [...input.removeImages] } : {}),
  }
}

/**
 * Multipart only when files are attached; JSON otherwise.
 *
 * That is not just an optimisation — a multipart part cannot carry a null, so
 * clearing the category (`category: null`) has to take the JSON branch.
 */
function send(method: 'post' | 'patch', url: string, input: Partial<ProductWrite>) {
  const body = toBody(input)
  return input.images?.length
    ? http[method](url, toFormData(body), MULTIPART_REQUEST)
    : http[method](url, body)
}

export async function postProduct(input: ProductWrite): Promise<ProductDetailDto> {
  const response = await send('post', STORE_ENDPOINTS.newProduct, input)
  return productDetailSchema.parse(response.data)
}

export async function patchProduct(productId: number, input: Partial<ProductWrite>): Promise<ProductDetailDto> {
  const response = await send('patch', STORE_ENDPOINTS.product(productId), input)
  return productDetailSchema.parse(response.data)
}

export async function deleteProductRequest(productId: number): Promise<void> {
  await http.delete(STORE_ENDPOINTS.product(productId))
}

/** Answers with the whole row, so the list can redraw without re-fetching. */
export async function patchProductStatus(
  productId: number,
  status: ProductWritableStatus,
): Promise<ProductRowDto> {
  const response = await http.patch(STORE_ENDPOINTS.productStatus(productId), { status })
  return productRowSchema.parse(response.data)
}

/**
 * Sends exactly one of `quantity` or `delta` — the union in the domain is what
 * makes that impossible to get wrong here.
 *
 * The response is the updated product row (undocumented, but confirmed against
 * the running API), so the caller gets the new quantity and stock state without
 * a second request.
 */
export async function postStockAdjustment(
  productId: number,
  input: StockAdjustmentInput,
): Promise<ProductDetailDto> {
  const change =
    input.change.kind === 'set' ? { quantity: input.change.quantity } : { delta: input.change.delta }
  const response = await http.post(STORE_ENDPOINTS.productStock(productId), {
    ...change,
    reason: input.reason,
  })
  return productDetailSchema.parse(response.data)
}

export async function getStockHistory(productId: number): Promise<readonly StockAdjustmentDto[]> {
  const response = await http.get(STORE_ENDPOINTS.productStock(productId))
  return stockHistoryResponseSchema.parse(response.data)
}
