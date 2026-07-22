import type { LowStockItem } from '@/features/dashboard/domain/entities/low-stock-item'
import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

export interface LowStockPanelProps {
  items: LowStockItem[]
  limit: number
  onSelect: (item: LowStockItem) => void
  onMore: () => void
}

/**
 * Inventory stock-alert list. Out-of-stock vs. low-stock styling is derived
 * from `stock` at render time (not stored); an empty seed shows the
 * all-clear state, and any items past `limit` collapse into a "+N more" link.
 */
export function LowStockPanel({ items, limit, onSelect, onMore }: LowStockPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2.25 py-1 text-sm text-ink-muted">
        <Icon name="check-circle" size={17} className="text-success" />
        All products are sufficiently stocked.
      </div>
    )
  }

  const visible = items.slice(0, limit)
  const hiddenCount = Math.max(0, items.length - limit)

  return (
    <>
      <div className="flex flex-col gap-1.75">
        {visible.map((item) => {
          const outOfStock = item.stock === 0
          const status = outOfStock ? 'Out of stock' : 'Low stock'
          const unitsLabel = `${item.stock} ${item.stock === 1 ? 'unit left' : 'units left'}`
          return (
            <button
              key={item.sku}
              type="button"
              onClick={() => onSelect(item)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2.75 py-2.25 text-left font-sans transition-shadow duration-140 ease-ks hover:shadow-card-hover',
                outOfStock
                  ? 'bg-danger-surface shadow-[inset_0_0_0_0.5px_var(--color-danger-border)]'
                  : 'bg-warning-surface shadow-[inset_0_0_0_0.5px_var(--color-warning-border)]',
              )}
            >
              <Icon
                name={outOfStock ? 'warning-octagon' : 'warning'}
                weight="fill"
                size={16}
                className={cn('shrink-0', outOfStock ? 'text-danger' : 'text-warning')}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-sm font-medium text-ink-strong">{item.name}</span>
                <span className="text-xs tabular-nums text-ink-subtle">
                  {item.sku} · {unitsLabel}
                </span>
              </span>
              <span className={cn('whitespace-nowrap text-xs font-semibold', outOfStock ? 'text-danger' : 'text-warning')}>{status}</span>
            </button>
          )
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={onMore}
          className="self-start border-none bg-transparent p-0 font-sans text-xs text-ink-subtle underline underline-offset-[3px]"
        >
          +{hiddenCount} more at or below threshold
        </button>
      )}
    </>
  )
}
