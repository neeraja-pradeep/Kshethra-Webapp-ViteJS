import { Icon } from '@/shared/ui'

interface SortableColumnHeaderProps<K extends string> {
  label: string
  sortKey: K
  activeKey: K | null
  direction: 'asc' | 'desc'
  onSort: (key: K) => void
}

/** Clickable table column header with a sort indicator (caret up/down, or a neutral arrow). */
export function SortableColumnHeader<K extends string>({ label, sortKey, activeKey, direction, onSort }: SortableColumnHeaderProps<K>) {
  const active = activeKey === sortKey
  const iconName = active ? (direction === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort(sortKey)
        }
      }}
      title={`Sort by ${label}`}
      className="inline-flex cursor-pointer select-none items-center gap-1"
    >
      {label}
      <Icon name={iconName} size={11} className={active ? 'opacity-90' : 'opacity-30'} />
    </span>
  )
}
