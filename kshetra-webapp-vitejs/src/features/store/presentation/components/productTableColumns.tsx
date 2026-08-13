import type { ReactNode } from 'react'

import { formatINR } from '@/shared/lib/format'
import { Badge, Icon, Switch, Tooltip, type TableColumn } from '@/shared/ui'

import {
  isMultiVariant,
  isTogglable,
  productStatusLabel,
  type ProductRow,
} from '@/features/store/domain/entities/product'
import { productStatusBadge, stockStateBadge } from '@/features/store/presentation/lib/catalogueFormat'
import type { ProductSortKey, SortDir } from '@/features/store/presentation/lib/productFilters'

function sortableHeader(
  label: string,
  key: ProductSortKey,
  sortKey: ProductSortKey | '',
  sortDir: SortDir,
  onSort: (key: ProductSortKey) => void,
): ReactNode {
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
      <Icon
        name={active ? (sortDir === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'}
        size={11}
        className={active ? 'opacity-90' : 'opacity-30'}
      />
    </span>
  )
}

/**
 * Column set for the products table.
 *
 * **Status has no sort control**: `?ordering=` accepts name, sku, category,
 * price, stock and created_at only, and anything else is a `400` rather than an
 * ignore — so offering it would be an error the operator could not avoid.
 */
export function buildProductColumns(
  sortKey: ProductSortKey | '',
  sortDir: SortDir,
  onSort: (key: ProductSortKey) => void,
  onToggleStatus: (row: ProductRow) => void,
  canToggle: boolean,
): TableColumn<ProductRow>[] {
  return [
    {
      key: 'name',
      header: sortableHeader('Product', 'name', sortKey, sortDir, onSort),
      render: (_v, row) => (
        <div className="flex items-center gap-2.5 py-px">
          {row.imageUrl && (
            <span
              className="h-8 w-8 flex-shrink-0 rounded-md bg-cover bg-center shadow-xs"
              style={{ backgroundImage: `url(${row.imageUrl})` }}
              role="presentation"
            />
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-ink-strong">{row.name}</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-subtle">
              {/* Null until the product has a variant to carry one. */}
              <span className="font-mono">{row.sku ?? 'No SKU yet'}</span>
              {isMultiVariant(row) && (
                <Tooltip content="This row shows the primary variant only. Manage the rest in the variants API.">
                  <Badge size="sm" color="blue">
                    +{row.variantCount - 1} variants
                  </Badge>
                </Tooltip>
              )}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: sortableHeader('Category', 'category', sortKey, sortDir, onSort),
      render: (_v, row) => <span className="text-ink-muted">{row.category?.name ?? '—'}</span>,
    },
    {
      key: 'price',
      header: sortableHeader('Price', 'price', sortKey, sortDir, onSort),
      align: 'right',
      render: (_v, row) => (
        <span className="tabular-nums text-ink">{row.price == null ? '—' : formatINR(row.price)}</span>
      ),
    },
    {
      key: 'stock',
      header: sortableHeader('Stock', 'stock', sortKey, sortDir, onSort),
      align: 'right',
      render: (_v, row) => {
        const badge = stockStateBadge(row.stockState)
        return (
          <span className="inline-flex items-center justify-end gap-1.75">
            <span className="tabular-nums text-ink">{row.stockQuantity}</span>
            <Badge size="sm" color={badge.color}>
              {badge.label}
            </Badge>
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (_v, row) => {
        // A discontinued line is a decision, not a switch position — the toggle
        // endpoint refuses it, so it renders as a static badge instead.
        if (!isTogglable(row)) {
          const badge = productStatusBadge(row.status)
          return (
            <Badge size="sm" color={badge.color}>
              {badge.label}
            </Badge>
          )
        }
        const active = row.status === 'active'
        return (
          <span className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Switch checked={active} size="sm" disabled={!canToggle} onChange={() => onToggleStatus(row)} />
            <span className={active ? 'min-w-[50px] text-xs text-success' : 'min-w-[50px] text-xs text-ink-subtle'}>
              {productStatusLabel(row.status)}
            </span>
          </span>
        )
      },
    },
  ]
}
