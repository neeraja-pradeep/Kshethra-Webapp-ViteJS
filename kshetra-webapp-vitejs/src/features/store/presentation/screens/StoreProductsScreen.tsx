import { useEffect, useMemo, useRef, useState } from 'react'

import { toFailure, toFieldErrors } from '@/core/error/result'
import { formatCount } from '@/shared/lib/format'
import { Alert, Icon, Input, Select, Spinner, Table } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import { useCategoriesQuery } from '@/features/store/application/queries/useCategoriesQuery'
import {
  useAdjustStockMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useSetProductStatusMutation,
  useUpdateProductMutation,
} from '@/features/store/application/queries/useProductMutations'
import {
  useProductDetailQuery,
  useProductsQuery,
  useStockHistoryQuery,
} from '@/features/store/application/queries/useProductsQuery'
import {
  PRODUCT_STATUSES,
  STOCK_STATES,
  productStatusLabel,
  stockStateLabel,
  type ProductRow,
} from '@/features/store/domain/entities/product'
import type { StockChange } from '@/features/store/domain/entities/stock-adjustment'
import type { ProductWrite } from '@/features/store/domain/repositories/product.repository'
import { stockStateDotClass } from '@/features/store/presentation/lib/catalogueFormat'
import {
  ALL,
  defaultProductListFilters,
  productListFiltersActive,
  toProductFilters,
  type ProductListFilterState,
  type ProductSortKey,
} from '@/features/store/presentation/lib/productFilters'

import { Button } from '@/shared/ui'
import { AdjustStockModal } from '../components/AdjustStockModal'
import { FilteredEmpty } from '../components/FilteredEmpty'
import { KpiTile } from '../components/KpiTile'
import { ListPagination } from '../components/ListPagination'
import { ProductDetailForm, type ProductFormValues } from '../components/ProductDetailForm'
import { StockHistoryPanel } from '../components/StockHistoryPanel'
import { ToastMessage } from '../components/ToastMessage'
import { buildProductColumns } from '../components/productTableColumns'

const DEFAULT_PAGE_SIZE = 20
/** One request per pause in typing, not per keystroke. */
const SEARCH_DEBOUNCE_MS = 300
const TOAST_MS = 2400

const EMPTY_SUMMARY = {
  total: 0,
  byStockState: { in_stock: 0, low_stock: 0, out_of_stock: 0 },
} as const

interface FormTarget {
  id: number | null
  mode: 'view' | 'edit'
}

/**
 * Store · Products — the catalogue, one row per sellable line.
 *
 * Every filter, the sort and the paging are applied by the server, and the
 * tiles come from its `summary`.
 */
export function StoreProductsScreen() {
  const can = useCan()
  const canAdd = can(PERMISSIONS.addProduct)
  const canEdit = can(PERMISSIONS.changeProduct)
  const canDelete = can(PERMISSIONS.deleteProduct)
  const canAdjustStock = can(PERMISSIONS.changeStock)
  const canViewStock = can(PERMISSIONS.viewStock)

  const [filters, setFilters] = useState<ProductListFilterState>(defaultProductListFilters)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [filters.search])

  const showToast = (message: string) => {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_MS)
  }

  const query = useMemo(
    () => toProductFilters(filters, page, pageSize, debouncedSearch),
    [filters, page, pageSize, debouncedSearch],
  )

  const productsQuery = useProductsQuery(query)
  const categoriesQuery = useCategoriesQuery()
  const detailQuery = useProductDetailQuery(formTarget?.id ?? null)
  const createProduct = useCreateProductMutation()
  const updateProduct = useUpdateProductMutation()
  const setStatus = useSetProductStatusMutation()
  const deleteProduct = useDeleteProductMutation()
  const adjustStock = useAdjustStockMutation()
  // Only fetched for an existing product, and only with `view_stock`.
  const stockHistory = useStockHistoryQuery(formTarget?.id ?? null, canViewStock && formTarget?.id != null)

  const rows = productsQuery.data?.results ?? []
  const count = productsQuery.data?.count ?? 0
  const summary = productsQuery.data?.summary ?? EMPTY_SUMMARY
  const stale = productsQuery.isPlaceholderData || productsQuery.isFetching
  const listFailure = toFailure(productsQuery.error) ?? toFailure(setStatus.error) ?? toFailure(deleteProduct.error)
  const filtersActive = productListFiltersActive(filters)

  function updateFilters(patch: Partial<ProductListFilterState>) {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
  }

  function handleSort(key: ProductSortKey) {
    updateFilters({
      sortKey: key,
      sortDir: filters.sortKey === key && filters.sortDir === 'asc' ? 'desc' : 'asc',
    })
  }

  function handleToggleStatus(row: ProductRow) {
    const next = row.status === 'active' ? 'inactive' : 'active'
    setStatus.mutate(
      { id: row.id, status: next },
      { onSuccess: () => showToast(`${row.name} ${next === 'active' ? 'activated' : 'deactivated'}`) },
    )
  }

  function toWrite(values: ProductFormValues): ProductWrite {
    return {
      name: values.name.trim(),
      category: values.categoryId ? Number(values.categoryId) : null,
      price: values.price === '' ? 0 : Number(values.price),
      description: values.description,
      status: values.status,
      lowStockThreshold: values.lowStockThreshold === '' ? undefined : Number(values.lowStockThreshold),
      ...(values.addedFiles.length ? { images: values.addedFiles } : {}),
      ...(values.removedImageIds.length ? { removeImages: values.removedImageIds } : {}),
    }
  }

  function handleSave(values: ProductFormValues) {
    const input = toWrite(values)
    if (formTarget?.id != null) {
      const id = formTarget.id
      updateProduct.mutate(
        { id, input },
        { onSuccess: () => { setFormTarget({ id, mode: 'view' }); showToast('Product saved') } },
      )
      return
    }
    createProduct.mutate(input, {
      onSuccess: (created) => {
        setFormTarget({ id: created.id, mode: 'view' })
        showToast(created.sku ? `Product created · SKU ${created.sku}` : 'Product created')
      },
    })
  }

  const categoryOptions = [
    { value: ALL, label: 'All categories' },
    // Inactive categories included: you must still be able to find the products
    // sitting in a switched-off one.
    ...(categoriesQuery.data ?? []).map((c) => ({ value: String(c.id), label: c.name })),
  ]
  const statusOptions = [
    { value: ALL, label: 'All statuses' },
    ...PRODUCT_STATUSES.map((s) => ({ value: s, label: productStatusLabel(s) })),
  ]

  const columns = buildProductColumns(filters.sortKey, filters.sortDir, handleSort, handleToggleStatus, canEdit)

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Products</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Catalogue, pricing and stock.</p>
        </div>
        {canAdd && (
          <Button
            theme="primary"
            iconLeft={<Icon name="plus" size={16} />}
            onClick={() => setFormTarget({ id: null, mode: 'edit' })}
          >
            Add product
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 px-7 pb-3">
        <div className="w-[280px] max-w-full">
          <Input
            size="sm"
            placeholder="Search name or SKU…"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            prefix={<Icon name="magnifying-glass" size={15} />}
          />
        </div>
        <div className="w-[190px] max-w-full">
          <Select
            size="sm"
            options={categoryOptions}
            value={filters.category}
            onChange={(e) => updateFilters({ category: e.target.value })}
          />
        </div>
        <div className="w-[170px] max-w-full">
          <Select
            size="sm"
            options={statusOptions}
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
          />
        </div>
        <div className="flex-1" />
        <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">
          {formatCount(count)} {count === 1 ? 'product' : 'products'}
        </span>
      </div>

      {/*
        Tiles come from `summary`, which is counted over search/category/status
        but NOT over stock_state — so clicking one does not zero the other three,
        and `summary.total` may legitimately exceed the paged `count`.
      */}
      <div className={`flex flex-wrap items-stretch gap-2.5 px-7 pb-3.5 ${stale ? 'opacity-60' : ''}`}>
        <KpiTile value={formatCount(summary.total)} label={summary.total === 1 ? 'product' : 'products'} />
        {STOCK_STATES.map((state) => (
          <KpiTile
            key={state}
            value={formatCount(summary.byStockState[state])}
            label={stockStateLabel(state)}
            dotClassName={stockStateDotClass(state)}
            active={filters.stockState === state}
            onClick={() => updateFilters({ stockState: filters.stockState === state ? ALL : state })}
          />
        ))}
      </div>

      {listFailure && (
        <div className="px-7 pb-3">
          <Alert type="danger">{listFailure.message}</Alert>
        </div>
      )}

      <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        {productsQuery.isPending ? (
          <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-3 text-ink-subtle">
            <Spinner size={28} />
            <span className="text-sm">Loading products…</span>
          </div>
        ) : rows.length > 0 ? (
          <div className={`min-h-0 flex-1 overflow-auto ${stale ? 'opacity-60' : ''}`} aria-busy={stale}>
            <Table
              columns={columns}
              rows={rows as ProductRow[]}
              onRowClick={(row) => setFormTarget({ id: row.id, mode: 'view' })}
              empty="No products yet."
            />
          </div>
        ) : (
          <div className="flex min-h-60 flex-1 items-center justify-center p-10 text-center text-sm text-ink-muted">
            {filtersActive ? (
              <FilteredEmpty
                message="No products match your filters."
                onClear={() => {
                  setFilters(defaultProductListFilters())
                  setPage(1)
                }}
              />
            ) : (
              'No products yet.'
            )}
          </div>
        )}
      </div>

      {!productsQuery.isPending && count > 0 && (
        <ListPagination
          total={count}
          // ListPagination is 0-based; the API is 1-based. Converted here only.
          page={page - 1}
          pageSize={pageSize}
          itemLabel="products"
          onPageChange={(next) => setPage(next + 1)}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}

      {formTarget && (
        <ProductDetailForm
          product={formTarget.id != null ? detailQuery.data ?? null : null}
          mode={formTarget.mode}
          categories={categoriesQuery.data ?? []}
          saving={createProduct.isPending || updateProduct.isPending}
          deleting={deleteProduct.isPending}
          fieldErrors={toFieldErrors(createProduct.error ?? updateProduct.error)}
          errorMessage={
            (toFailure(createProduct.error) ?? toFailure(updateProduct.error) ?? toFailure(detailQuery.error))
              ?.message ?? null
          }
          canEdit={canEdit}
          canDelete={canDelete}
          canAdjustStock={canAdjustStock}
          onStartEdit={() => setFormTarget((t) => t && { ...t, mode: 'edit' })}
          onCancel={() => setFormTarget((t) => (t?.id != null ? { id: t.id, mode: 'view' } : null))}
          onSave={handleSave}
          onOpenAdjustStock={() => setAdjustOpen(true)}
          stockHistory={
            canViewStock && formTarget.id != null ? (
              <StockHistoryPanel
                entries={stockHistory.data ?? []}
                loading={stockHistory.isPending}
                errorMessage={toFailure(stockHistory.error)?.message ?? null}
              />
            ) : undefined
          }
          onDeactivate={() => {
            if (formTarget.id == null) return
            setStatus.mutate(
              { id: formTarget.id, status: 'inactive' },
              { onSuccess: () => showToast('Product deactivated') },
            )
          }}
          onDelete={() => {
            if (formTarget.id == null) return
            deleteProduct.mutate(formTarget.id, {
              onSuccess: () => {
                setFormTarget(null)
                showToast('Product deleted')
              },
            })
          }}
        />
      )}

      <AdjustStockModal
        open={adjustOpen}
        productName={detailQuery.data?.name ?? ''}
        currentStock={detailQuery.data?.stockQuantity ?? 0}
        saving={adjustStock.isPending}
        errorMessage={toFailure(adjustStock.error)?.message ?? null}
        onClose={() => setAdjustOpen(false)}
        onSave={(change: StockChange, reason: string) => {
          if (formTarget?.id == null) return
          adjustStock.mutate(
            { id: formTarget.id, input: { change, reason } },
            {
              onSuccess: (detail) => {
                setAdjustOpen(false)
                showToast(`Stock updated — ${detail.stockQuantity} on the shelf`)
              },
            },
          )
        }}
      />

      <ToastMessage show={toast.show} message={toast.message} />
    </div>
  )
}
