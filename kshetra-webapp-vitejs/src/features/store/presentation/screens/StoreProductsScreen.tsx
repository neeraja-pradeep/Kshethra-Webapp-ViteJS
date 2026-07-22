import { useRef, useState } from 'react'

import { formatCount } from '@/shared/lib/format'
import { Button, Icon, Input, Select, Table } from '@/shared/ui'

import type { Product } from '@/features/store/domain/entities/product'
import { CATEGORIES } from '@/features/store/presentation/data/categories.mock'
import { ORDERS } from '@/features/store/presentation/data/orders.mock'
import { PRODUCTS } from '@/features/store/presentation/data/products.mock'

import { ConfirmDialog } from '../components/ConfirmDialog'
import { FilteredEmpty } from '../components/FilteredEmpty'
import { KpiTile } from '../components/KpiTile'
import { ListPagination } from '../components/ListPagination'
import type { ProductFormValues } from '../components/ProductDetailForm'
import { ProductDetailForm } from '../components/ProductDetailForm'
import { buildProductColumns, type ProductRow, type ProductSortKey, type SortDir } from '../components/productTableColumns'
import { ToastMessage } from '../components/ToastMessage'
import { categoryName, productHasOrders, stockLevel } from '../lib/storeFormat'

interface FormTarget {
  id: string | null
  mode: 'view' | 'edit'
}

const PAGE_SIZE_DEFAULT = 20

/** Store · Products — catalogue list with pricing/stock KPIs, and a view-first create/edit form. */
export function StoreProductsScreen() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState<ProductSortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null)
  const [listConfirm, setListConfirm] = useState<{ id: string; name: string } | null>(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string) => {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), 2400)
  }

  const hasFilters = search.trim() !== '' || categoryFilter !== 'all' || statusFilter !== 'all'

  const filtered = products
    .filter((p) => {
      if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      const q = search.trim().toLowerCase()
      if (q && !`${p.name} ${p.id} ${categoryName(CATEGORIES, p.categoryId)}`.toLowerCase().includes(q)) return false
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  if (sortKey) {
    const dir = sortDir === 'desc' ? -1 : 1
    const value = (p: Product): string | number => {
      if (sortKey === 'category') return categoryName(CATEGORIES, p.categoryId)
      if (sortKey === 'stock') return p.stock
      if (sortKey === 'price') return p.price
      if (sortKey === 'status') return p.status
      return p.name
    }
    filtered.sort((a, b) => {
      const x = value(a)
      const y = value(b)
      if (typeof x === 'number' && typeof y === 'number') return dir * (x - y)
      return dir * String(x).localeCompare(String(y), undefined, { numeric: true })
    })
  }

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pages - 1)
  const pageProducts = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize)

  const rows: ProductRow[] = pageProducts.map((p) => {
    const level = stockLevel(p)
    return { id: p.id, name: p.name, sku: p.id, category: categoryName(CATEGORIES, p.categoryId), price: p.price, stock: p.stock, status: p.status, stockLabel: level.label, stockColor: level.color }
  })

  const counts = { 'In stock': 0, 'Low stock': 0, 'Out of stock': 0 }
  filtered.forEach((p) => {
    counts[stockLevel(p).label] += 1
  })

  const handleSort = (key: ProductSortKey) => {
    setSortDir((d) => (sortKey === key && d === 'asc' ? 'desc' : 'asc'))
    setSortKey(key)
    setPage(0)
  }

  const handleToggleFromList = (row: ProductRow) => {
    const p = products.find((x) => x.id === row.id)
    if (!p) return
    if (p.status === 'Active') {
      setListConfirm({ id: p.id, name: p.name })
    } else {
      setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: 'Active' } : x)))
      showToast(`${p.name} activated`)
    }
  }

  const columns = buildProductColumns(sortKey, sortDir, handleSort, handleToggleFromList)
  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setPage(0)
  }

  const openProduct = formTarget?.id ? products.find((p) => p.id === formTarget.id) ?? null : null

  const handleSave = (values: ProductFormValues) => {
    const price = parseInt(values.price, 10) || 0
    if (formTarget?.id) {
      const id = formTarget.id
      setProducts((ps) =>
        ps.map((p) => (p.id === id ? { ...p, name: values.name.trim(), categoryId: values.categoryId, price, description: values.description, images: values.images, status: values.status } : p)),
      )
      setFormTarget({ id, mode: 'view' })
    } else {
      const prefix = (categoryName(CATEGORIES, values.categoryId).replace(/[^A-Za-z]/g, '').slice(0, 3) || 'PRD').toUpperCase()
      const id = `${prefix}-${100 + products.length + 1}`
      setProducts((ps) =>
        ps.concat([
          {
            id,
            name: values.name.trim(),
            categoryId: values.categoryId,
            price,
            description: values.description,
            images: values.images,
            status: values.status,
            stock: 0,
            lowStockThreshold: 10,
            stockLog: [],
          },
        ]),
      )
      setFormTarget({ id, mode: 'view' })
    }
    showToast('Product saved')
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Products</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Store catalogue, pricing, and stock.</p>
        </div>
        <Button theme="primary" iconLeft={<Icon name="plus" size={16} />} onClick={() => setFormTarget({ id: null, mode: 'edit' })}>
          Add product
        </Button>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 px-7 pb-3">
        <div className="w-[260px] max-w-full">
          <Input
            size="sm"
            placeholder="Search products…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            prefix={<Icon name="magnifying-glass" size={15} />}
          />
        </div>
        <div className="w-[190px]">
          <Select
            size="sm"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(0)
            }}
            options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((c) => ({ value: c.id, label: c.name }))]}
          />
        </div>
        <div className="w-40">
          <Select
            size="sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap gap-2.5 px-7 pb-3.5">
        <KpiTile value={formatCount(total)} label="products" />
        <KpiTile value={formatCount(counts['In stock'])} label="In stock" dotClassName="bg-success" />
        <KpiTile value={formatCount(counts['Low stock'])} label="Low stock" dotClassName="bg-warning" />
        <KpiTile value={formatCount(counts['Out of stock'])} label="Out of stock" dotClassName="bg-danger" />
      </div>

      <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
        <div className="min-h-0 flex-1 overflow-auto">
          <Table
            columns={columns}
            rows={rows}
            onRowClick={(row) => setFormTarget({ id: row.id, mode: 'view' })}
            empty={hasFilters ? <FilteredEmpty message="No products match your filters." onClear={clearFilters} /> : 'No products yet.'}
          />
        </div>
      </div>

      <ListPagination total={total} page={currentPage} pageSize={pageSize} itemLabel="products" onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(0) }} />

      {formTarget && (
        <ProductDetailForm
          product={openProduct}
          mode={formTarget.mode}
          categories={CATEGORIES}
          hasOrders={openProduct ? productHasOrders(ORDERS, openProduct.id) : false}
          onStartEdit={() => setFormTarget((t) => t && { ...t, mode: 'edit' })}
          onCancel={() => setFormTarget((t) => (t?.id ? { id: t.id, mode: 'view' } : null))}
          onSave={handleSave}
          onAdjustStock={(newStock, reason) => {
            if (!formTarget.id) return
            const id = formTarget.id
            setProducts((ps) =>
              ps.map((p) => {
                if (p.id !== id) return p
                const delta = newStock - p.stock
                const change = `${delta >= 0 ? '+' : ''}${delta} → ${newStock} units`
                return { ...p, stock: newStock, stockLog: [{ change, reason, who: `Priya Menon · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` }, ...p.stockLog] }
              }),
            )
            showToast('Stock updated')
          }}
          onDeactivate={() => {
            if (!formTarget.id) return
            const id = formTarget.id
            setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, status: 'Inactive' } : p)))
            showToast(`${openProduct?.name ?? 'Product'} deactivated`)
          }}
          onDelete={() => {
            if (!formTarget.id) return
            const id = formTarget.id
            const name = openProduct?.name ?? 'Product'
            setProducts((ps) => ps.filter((p) => p.id !== id))
            setFormTarget(null)
            showToast(`${name} deleted`)
          }}
        />
      )}

      <ConfirmDialog
        open={!!listConfirm}
        title="Deactivate product?"
        body={`"${listConfirm?.name ?? ''}" stops appearing in the app store for new orders. Existing orders and history keep their data.`}
        confirmLabel="Deactivate"
        onCancel={() => setListConfirm(null)}
        onConfirm={() => {
          if (listConfirm) {
            setProducts((ps) => ps.map((p) => (p.id === listConfirm.id ? { ...p, status: 'Inactive' } : p)))
            showToast(`${listConfirm.name} deactivated`)
          }
          setListConfirm(null)
        }}
      />

      <ToastMessage show={toast.show} message={toast.message} />
    </div>
  )
}
