import { Icon } from '@/shared/ui'
import type { OrderSortKey } from '@/features/orders/presentation/lib/orderFilters'

export interface OrdersSortableHeaderProps {
  label: string
  sortKey: OrderSortKey
  activeSortKey: OrderSortKey | ''
  sortDir: 'asc' | 'desc'
  onSort: (key: OrderSortKey) => void
}

/** Clickable orders-table column header showing an up/down/neutral sort glyph. */
export function OrdersSortableHeader({ label, sortKey, activeSortKey, sortDir, onSort }: OrdersSortableHeaderProps) {
  const active = activeSortKey === sortKey
  const iconName = active ? (sortDir === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'
  return (
    <span
      role="button"
      tabIndex={0}
      title={`Sort by ${label}`}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort(sortKey)
        }
      }}
      className="inline-flex cursor-pointer select-none items-center gap-1"
    >
      {label}
      <Icon name={iconName} size={11} style={{ opacity: active ? 0.9 : 0.32 }} />
    </span>
  )
}
