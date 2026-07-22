import { Icon } from '@/shared/ui'

export interface SortableHeaderProps<K extends string> {
  label: string
  sortKey: K
  activeKey: K | ''
  direction: 'asc' | 'desc'
  onSort: (key: K) => void
}

/** Clickable table column header with a sort direction indicator. */
export function SortableHeader<K extends string>({ label, sortKey, activeKey, direction, onSort }: SortableHeaderProps<K>) {
  const active = activeKey === sortKey
  const iconName = active ? (direction === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'

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
