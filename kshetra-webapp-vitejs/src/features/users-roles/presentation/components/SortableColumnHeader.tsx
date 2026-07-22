import { Icon } from '@/shared/ui'

export interface SortableColumnHeaderProps {
  label: string
  sortKey: string
  activeSortKey: string
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
}

/** Clickable table column header showing an up/down/neutral sort glyph. */
export function SortableColumnHeader({ label, sortKey, activeSortKey, sortDir, onSort }: SortableColumnHeaderProps) {
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
