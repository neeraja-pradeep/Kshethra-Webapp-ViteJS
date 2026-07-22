import type { ReactNode } from 'react'

import { formatINR } from '@/shared/lib/format'
import { Badge, Icon, Switch, type BadgeColor, type TableColumn } from '@/shared/ui'

import type { ProductStatus } from '@/features/store/domain/entities/product'

export interface ProductRow {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  status: ProductStatus
  stockLabel: string
  stockColor: BadgeColor
}

export type ProductSortKey = 'name' | 'category' | 'price' | 'stock' | 'status'
export type SortDir = 'asc' | 'desc'

function sortableHeader(label: string, key: ProductSortKey, sortKey: ProductSortKey | null, sortDir: SortDir, onSort: (key: ProductSortKey) => void): ReactNode {
  const active = sortKey === key
  return (
    <span
      role="button"
      tabIndex={0}
      title={`Sort by ${label}`}
      onClick={() => onSort(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort(key)
        }
      }}
      className="inline-flex cursor-pointer select-none items-center gap-1"
    >
      {label}
      <Icon name={active ? (sortDir === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'} size={11} className={active ? 'opacity-90' : 'opacity-30'} />
    </span>
  )
}

/** Column set for the products table — name+SKU, price, stock+badge, status toggle. */
export function buildProductColumns(
  sortKey: ProductSortKey | null,
  sortDir: SortDir,
  onSort: (key: ProductSortKey) => void,
  onToggleStatus: (row: ProductRow) => void,
): TableColumn<ProductRow>[] {
  return [
    {
      key: 'name',
      header: sortableHeader('Product', 'name', sortKey, sortDir, onSort),
      render: (v, row) => (
        <div className="flex flex-col gap-0.5 py-px">
          <span className="font-medium text-ink-strong">{v as string}</span>
          <span className="text-xs text-ink-subtle">{row.sku}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: sortableHeader('Category', 'category', sortKey, sortDir, onSort),
      render: (v) => <span className="text-ink-muted">{v as string}</span>,
    },
    {
      key: 'price',
      header: sortableHeader('Price', 'price', sortKey, sortDir, onSort),
      align: 'right',
      render: (v) => <span className="tabular-nums text-ink">{formatINR(v as number)}</span>,
    },
    {
      key: 'stock',
      header: sortableHeader('Stock', 'stock', sortKey, sortDir, onSort),
      align: 'right',
      render: (v, row) => (
        <span className="inline-flex items-center justify-end gap-1.75">
          <span className="tabular-nums text-ink">{v as number}</span>
          <Badge size="sm" color={row.stockColor}>
            {row.stockLabel}
          </Badge>
        </span>
      ),
    },
    {
      key: 'status',
      header: sortableHeader('Status', 'status', sortKey, sortDir, onSort),
      render: (_v, row) => (
        <span className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Switch checked={row.status === 'Active'} size="sm" onChange={() => onToggleStatus(row)} />
          <span className={row.status === 'Active' ? 'min-w-[50px] text-xs text-success' : 'min-w-[50px] text-xs text-ink-subtle'}>{row.status}</span>
        </span>
      ),
    },
  ]
}
